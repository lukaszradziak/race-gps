// ─── UUIDs — must match firmware ─────────────────────────────────────────────
const SERVICE_UUID        = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const TELEMETRY_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
const COMMAND_CHAR_UUID   = 'beb5483f-36e1-4688-b7f5-ea07361b26a8';

const STATS_HISTORY  = 150;     // chart data points (~6s at 25Hz)
const SPEED_HISTORY  = 150;     // speed chart points (~6s at 25Hz)
const LOG_EVERY      = 50;      // snapshot to log every N frames
const EMIT_INTERVAL  = 250;     // ms — how often React gets an update
const MAX_RECORDS    = 30_000;  // ~20 min at 25Hz; oldest frames trimmed when exceeded
const TRIM_BY        =  2_500;  // trim in one chunk (~100s) to amortize splice cost

// ─── Frame layout (must match firmware TelemetryFrame, little-endian, packed)
// Offset  Size  Field
//   0      4    timestamp_ms  (uint32)
//   4      2    seq           (uint16)
//   6      4    speed_mmps    (int32)  — NAV-PVT gSpeed in mm/s
//  10      4    altitude_mm   (int32)  — NAV-PVT hMSL in mm
//  14      2    hacc_dm       (uint16) — hAcc/100, dm (0.1 m units)
//  16      1    sats          (uint8)  — numSV
//  17      1    fix           (uint8)  — fixType: 0=no fix, 2=2D, 3=3D, 4=GNSS+DR
// Total: 18 bytes
const FRAME_BYTES = 18;

export interface TelemetryFrame {
  timestamp_ms: number;
  seq:          number;
  speed_mmps:   number;
  altitude_mm:  number;
  hacc_dm:      number;
  sats:         number;
  fix:          number;
  // client-computed
  speed_kmh:    number;
  altitude_m:   number;
  hacc_m:       number;
  accel_mss:    number;   // m/s², derived from Δspeed/Δtime using firmware clock
}

export const FIX_LABEL: Record<number, string> = {
  0: 'Brak',
  1: 'Dead reckoning',
  2: '2D',
  3: '3D',
  4: 'GNSS+DR',
  5: 'Tylko czas',
};

export interface FrameStat {
  interval_ms: number;
  dropped:     number;
}

export interface BLEUpdate {
  frame:        TelemetryFrame;
  stats:        FrameStat[];
  speedHistory: number[];
  logs:         string[];
  recordCount:  number;
}

// ─── Commands ─────────────────────────────────────────────────────────────────
export const CMD = {
  PING:        0x01,
  ASSIST_TIME: 0x02,
  ASSIST_POS:  0x03,
} as const;

// GPS-UTC leap seconds — update when IERS announces a new one (last: Jan 2017 → 18 s).
const GPS_LEAP_SECONDS = 18;

export interface AssistResult {
  time: boolean;
  pos:  boolean;
  posAccuracy?: number;  // metres
}

// Sends UBX-MGA-INI-TIME_UTC + optionally UBX-MGA-INI-POS_LLH.
// Uses browser geolocation for position (IP/WiFi triangulation — even ±5 km helps).
export async function sendAssist(ble: BLEService): Promise<AssistResult> {
  // ── Time (always succeeds) ────────────────────────────────────────────────
  const now = new Date();
  const timeBuf = new Uint8Array(8);
  const tv = new DataView(timeBuf.buffer);
  tv.setUint16(0, now.getUTCFullYear(), true);
  timeBuf[2] = now.getUTCMonth() + 1;
  timeBuf[3] = now.getUTCDate();
  timeBuf[4] = now.getUTCHours();
  timeBuf[5] = now.getUTCMinutes();
  timeBuf[6] = now.getUTCSeconds();
  timeBuf[7] = GPS_LEAP_SECONDS;
  await ble.sendCommand(CMD.ASSIST_TIME, timeBuf);

  // ── Position (optional — geolocation may be denied or unavailable) ────────
  try {
    const geoPos = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,  // WiFi/cell is enough and responds instantly
        timeout: 10_000,
        maximumAge: 5 * 60_000,    // cached position up to 5 min is fine for AGPS
      })
    );

    const { latitude, longitude, accuracy, altitude, altitudeAccuracy } = geoPos.coords;

    // Altitude: browser reports metres above WGS84 ellipsoid (same unit as UBX-MGA-INI-POS_LLH).
    // When unavailable (WiFi positioning), assume ±500 m vertical uncertainty so we
    // don't constrain the module with a wrong height (0 m WGS84 = ~-34 m MSL in Warsaw).
    const altCm    = altitude != null ? Math.round(altitude * 100) : 0;
    const hAccM    = accuracy;
    const vAccM    = altitude != null ? (altitudeAccuracy ?? 200) : 500;
    const posAccCm = Math.round(Math.sqrt(hAccM * hAccM + vAccM * vAccM) * 100);

    const posBuf = new Uint8Array(16);
    const pv = new DataView(posBuf.buffer);
    pv.setInt32 (0,  Math.round(latitude  * 1e7), true);
    pv.setInt32 (4,  Math.round(longitude * 1e7), true);
    pv.setInt32 (8,  altCm, true);
    pv.setUint32(12, posAccCm, true);
    await ble.sendCommand(CMD.ASSIST_POS, posBuf);

    return { time: true, pos: true, posAccuracy: Math.round(accuracy) };
  } catch {
    return { time: true, pos: false };
  }
}

// ─── BLEService ───────────────────────────────────────────────────────────────
type UpdateHandler     = (data: BLEUpdate) => void;
type ConnectHandler    = () => void;
type DisconnectHandler = () => void;

export class BLEService {
  private device:        BluetoothDevice | null = null;
  private server:        BluetoothRemoteGATTServer | null = null;
  private telemetryChar: BluetoothRemoteGATTCharacteristic | null = null;
  private commandChar:   BluetoothRemoteGATTCharacteristic | null = null;

  // Internal high-frequency state — never touches React directly
  private prevTimestampMs  = -1;
  private prevSeq          = -1;
  private prevSpeedMmps    = -1;
  private sessionStart     = 0;
  private frameCount       = 0;
  private totalDropped     = 0;
  private statsBuffer:  FrameStat[]     = [];
  private speedBuf:     number[]        = [];
  private intervalBuf:  number[]        = [];
  private latestFrame:  TelemetryFrame | null = null;
  private logs:         string[]        = [];

  private emitTimer: ReturnType<typeof setInterval> | null = null;

  private recording    = false;
  private recordBuffer: TelemetryFrame[] = [];

  private updateHandler?:     UpdateHandler;
  private connectHandler?:    ConnectHandler;
  private disconnectHandler?: DisconnectHandler;

  onUpdate(cb: UpdateHandler): this         { this.updateHandler     = cb; return this; }
  onConnect(cb: ConnectHandler): this       { this.connectHandler    = cb; return this; }
  onDisconnect(cb: DisconnectHandler): this { this.disconnectHandler = cb; return this; }

  downloadCSV(): void {
    const { blob, filename } = this.buildCSV();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async shareCSV(): Promise<void> {
    const { blob, filename } = this.buildCSV();
    if (!blob) return;
    const file = new File([blob], filename, { type: 'text/csv' });
    try {
      await navigator.share({ files: [file], title: filename });
    } catch (e) {
      if ((e as Error).name !== 'AbortError') throw e;
    }
  }

  private buildCSV(): { blob: Blob | null; filename: string } {
    if (this.recordBuffer.length === 0) return { blob: null, filename: '' };
    const cols = ['timestamp_ms','seq','speed_kmh','altitude_m','hacc_m','sats','fix','accel_mss'];
    const rows = this.recordBuffer.map(f =>
      [f.timestamp_ms, f.seq,
       f.speed_kmh.toFixed(4), f.altitude_m.toFixed(3), f.hacc_m.toFixed(2),
       f.sats, f.fix, f.accel_mss.toFixed(4)].join(',')
    );
    const csv      = [cols.join(','), ...rows].join('\n');
    const filename = `race-gps-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    return { blob: new Blob([csv], { type: 'text/csv' }), filename };
  }

  async connect(): Promise<void> {
    this.device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [SERVICE_UUID] }],
    });
    this.device.addEventListener('gattserverdisconnected', () => {
      this.stopEmit();
      this.disconnectHandler?.();
    });

    this.server = await this.device.gatt!.connect();
    const service = await this.server.getPrimaryService(SERVICE_UUID);

    [this.telemetryChar, this.commandChar] = await Promise.all([
      service.getCharacteristic(TELEMETRY_CHAR_UUID),
      service.getCharacteristic(COMMAND_CHAR_UUID),
    ]);

    this.telemetryChar.addEventListener('characteristicvaluechanged', (e) => {
      const char = e.target as BluetoothRemoteGATTCharacteristic;
      if (char.value) this.handleFrame(char.value);
    });
    await this.telemetryChar.startNotifications();

    this.prevTimestampMs = -1;
    this.prevSeq         = -1;
    this.prevSpeedMmps   = -1;
    this.sessionStart    = performance.now();
    this.frameCount      = 0;
    this.totalDropped    = 0;
    this.statsBuffer     = [];
    this.speedBuf        = [];
    this.intervalBuf     = [];
    this.latestFrame     = null;
    this.logs            = [];

    this.recordBuffer = [];
    this.recording    = true;
    this.addLog('CONNECTED');
    this.startEmit();
    this.connectHandler?.();
  }

  async disconnect(): Promise<void> {
    if (this.telemetryChar) await this.telemetryChar.stopNotifications().catch(() => {});
    this.server?.disconnect();
  }

  async sendCommand(cmd: number, payload: Uint8Array = new Uint8Array()): Promise<void> {
    if (!this.commandChar) throw new Error('BLE not connected');
    const buf = new Uint8Array(1 + payload.length);
    buf[0] = cmd;
    buf.set(payload, 1);
    await this.commandChar.writeValueWithoutResponse(buf);
  }

  get connected(): boolean { return this.server?.connected ?? false; }

  formatLogs(): string {
    return [
      'Race GPS v2 — BLE log',
      `Date: ${new Date().toLocaleString('pl-PL')}`,
      '─'.repeat(48),
      ...this.logs,
    ].join('\n');
  }

  // ── Internal: frame processing at 25Hz ───────────────────────────────────
  private handleFrame(view: DataView): void {
    if (view.byteLength < FRAME_BYTES) return;

    const timestamp_ms = view.getUint32(0, true);
    const seq          = view.getUint16(4, true);
    const speed_mmps   = view.getInt32(6, true);
    const altitude_mm  = view.getInt32(10, true);
    const hacc_dm      = view.getUint16(14, true);
    const sats         = view.getUint8(16);
    const fix          = view.getUint8(17);

    const interval = this.prevTimestampMs >= 0 ? timestamp_ms - this.prevTimestampMs : 0;
    const dropped  = this.prevSeq >= 0
      ? Math.max(0, (seq - this.prevSeq - 1 + 65536) % 65536)
      : 0;

    // Acceleration: Δspeed / Δtime, computed from firmware timestamps (ms).
    // Skip first frame and frames with no GPS fix (fix=0).
    const dt_s = interval / 1000;
    const accel_mss = (this.prevSpeedMmps >= 0 && dt_s > 0 && fix > 0)
      ? (speed_mmps - this.prevSpeedMmps) / 1000 / dt_s
      : 0;

    this.prevTimestampMs = timestamp_ms;
    this.prevSeq         = seq;
    this.prevSpeedMmps   = speed_mmps;
    this.frameCount     += 1;
    this.totalDropped   += dropped;

    this.latestFrame = {
      timestamp_ms,
      seq,
      speed_mmps,
      altitude_mm,
      hacc_dm,
      sats,
      fix,
      speed_kmh:  speed_mmps * 3.6 / 1000,
      altitude_m: altitude_mm / 1000,
      hacc_m:     hacc_dm / 10,
      accel_mss,
    };

    if (this.recording) {
      if (this.recordBuffer.length >= MAX_RECORDS) this.recordBuffer.splice(0, TRIM_BY);
      this.recordBuffer.push(this.latestFrame!);
    }

    if (interval > 0) this.intervalBuf.push(interval);

    const kmh = speed_mmps * 3.6 / 1000;
    if (this.speedBuf.length >= SPEED_HISTORY) {
      this.speedBuf = [...this.speedBuf.slice(1), kmh];
    } else {
      this.speedBuf = [...this.speedBuf, kmh];
    }

    const stat: FrameStat = { interval_ms: interval, dropped };
    if (this.statsBuffer.length >= STATS_HISTORY) {
      this.statsBuffer = [...this.statsBuffer.slice(1), stat];
    } else {
      this.statsBuffer = [...this.statsBuffer, stat];
    }

    if (this.frameCount % LOG_EVERY === 0 && this.intervalBuf.length > 0) {
      const buf    = this.intervalBuf;
      const avg    = buf.reduce((a, b) => a + b, 0) / buf.length;
      const jitter = Math.sqrt(buf.reduce((a, b) => a + (b - avg) ** 2, 0) / buf.length);
      this.addLog(
        `STATS  frames=${this.frameCount}` +
        `  avg=${avg.toFixed(0)}ms  jitter=±${jitter.toFixed(0)}ms` +
        `  dropped=${this.totalDropped}` +
        `  fix=${fix}  sats=${sats}  speed=${(speed_mmps * 3.6 / 1000).toFixed(1)}km/h`,
      );
      this.intervalBuf = [];
    }
  }

  private startEmit(): void {
    this.emitTimer = setInterval(() => {
      if (this.latestFrame && this.updateHandler) {
        this.updateHandler({ frame: this.latestFrame, stats: this.statsBuffer, speedHistory: this.speedBuf, logs: this.logs, recordCount: this.recordBuffer.length });
      }
    }, EMIT_INTERVAL);
  }

  private stopEmit(): void {
    if (this.emitTimer !== null) { clearInterval(this.emitTimer); this.emitTimer = null; }
    this.recording = false;
  }

  private addLog(msg: string): void {
    const elapsed = ((performance.now() - this.sessionStart) / 1000).toFixed(3);
    this.logs = [...this.logs, `[+${elapsed}s] ${msg}`];
  }
}
