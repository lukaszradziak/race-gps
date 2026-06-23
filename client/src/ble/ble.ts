// ─── UUIDs — must match firmware ─────────────────────────────────────────────
const SERVICE_UUID        = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const TELEMETRY_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
const COMMAND_CHAR_UUID   = 'beb5483f-36e1-4688-b7f5-ea07361b26a8';

const STATS_HISTORY  = 150;  // chart data points (~6s at 25Hz)
const LOG_EVERY      = 50;   // snapshot to log every N frames
const EMIT_INTERVAL  = 250;  // ms — how often React gets an update

// ─── Frame types ──────────────────────────────────────────────────────────────
// Layout must match firmware TelemetryFrame struct (little-endian, packed).
export interface TelemetryFrame {
  timestamp_ms: number;  // uint32 @ offset 0
  seq: number;           // uint16 @ offset 4
}

// One entry per received BLE notification, stored internally at 25Hz.
// Emitted to React inside BLEUpdate at 4Hz.
export interface FrameStat {
  interval_ms: number;
  dropped: number;
}

// Snapshot sent to React every EMIT_INTERVAL ms.
export interface BLEUpdate {
  frame: TelemetryFrame;
  stats: FrameStat[];   // rolling STATS_HISTORY entries
  logs: string[];       // full log for clipboard
}

// ─── Commands ─────────────────────────────────────────────────────────────────
export const CMD = {
  PING: 0x01,
} as const;

// ─── BLEService ───────────────────────────────────────────────────────────────
type UpdateHandler     = (data: BLEUpdate) => void;
type ConnectHandler    = () => void;
type DisconnectHandler = () => void;

export class BLEService {
  // BLE handles
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private telemetryChar: BluetoothRemoteGATTCharacteristic | null = null;
  private commandChar: BluetoothRemoteGATTCharacteristic | null = null;

  // Internal state — updated at 25Hz, never touches React
  private prevTimestampMs = -1;  // firmware clock — immune to JS queue delays
  private prevSeq         = -1;
  private sessionStart = 0;
  private frameCount   = 0;
  private totalDropped = 0;
  private statsBuffer: FrameStat[] = [];
  private intervalBuf: number[]    = [];
  private latestFrame: TelemetryFrame | null = null;
  private logs: string[]           = [];

  // Throttle timer
  private emitTimer: ReturnType<typeof setInterval> | null = null;

  // Handlers
  private updateHandler?:     UpdateHandler;
  private connectHandler?:    ConnectHandler;
  private disconnectHandler?: DisconnectHandler;

  // ── Event registration ────────────────────────────────────────────────────
  onUpdate(cb: UpdateHandler): this         { this.updateHandler     = cb; return this; }
  onConnect(cb: ConnectHandler): this       { this.connectHandler    = cb; return this; }
  onDisconnect(cb: DisconnectHandler): this { this.disconnectHandler = cb; return this; }

  // ── Connection ────────────────────────────────────────────────────────────
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

    // Reset internal state for the new session
    this.prevTimestampMs = -1;
    this.prevSeq         = -1;
    this.sessionStart = performance.now();
    this.frameCount   = 0;
    this.totalDropped = 0;
    this.statsBuffer  = [];
    this.intervalBuf  = [];
    this.latestFrame  = null;
    this.logs         = [];

    this.addLog('CONNECTED');
    this.startEmit();
    this.connectHandler?.();
  }

  async disconnect(): Promise<void> {
    if (this.telemetryChar) {
      await this.telemetryChar.stopNotifications().catch(() => {});
    }
    this.server?.disconnect();
  }

  // ── Send command ──────────────────────────────────────────────────────────
  async sendCommand(cmd: number, payload: Uint8Array = new Uint8Array()): Promise<void> {
    if (!this.commandChar) throw new Error('BLE not connected');
    const buf = new Uint8Array(1 + payload.length);
    buf[0] = cmd;
    buf.set(payload, 1);
    await this.commandChar.writeValueWithoutResponse(buf);
  }

  get connected(): boolean {
    return this.server?.connected ?? false;
  }

  // Returns formatted log text ready for clipboard.
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
    if (view.byteLength < 6) return;

    const frame: TelemetryFrame = {
      timestamp_ms: view.getUint32(0, true),
      seq:          view.getUint16(4, true),
    };

    // Use firmware clock for interval — JS performance.now() includes event-queue
    // delays which cause paired false spikes (one long bar + one short bar).
    const interval = this.prevTimestampMs >= 0
      ? frame.timestamp_ms - this.prevTimestampMs
      : 0;
    const dropped  = this.prevSeq >= 0
      ? Math.max(0, (frame.seq - this.prevSeq - 1 + 65536) % 65536)
      : 0;

    this.prevTimestampMs = frame.timestamp_ms;
    this.prevSeq         = frame.seq;
    this.frameCount   += 1;
    this.totalDropped += dropped;
    this.latestFrame   = frame;

    if (interval > 0) this.intervalBuf.push(interval);

    // Rolling chart buffer — pure array ops, no React
    const stat: FrameStat = { interval_ms: interval, dropped };
    if (this.statsBuffer.length >= STATS_HISTORY) {
      this.statsBuffer = [...this.statsBuffer.slice(1), stat];
    } else {
      this.statsBuffer = [...this.statsBuffer, stat];
    }

    // Periodic log snapshot
    if (this.frameCount % LOG_EVERY === 0 && this.intervalBuf.length > 0) {
      const buf    = this.intervalBuf;
      const avg    = buf.reduce((a, b) => a + b, 0) / buf.length;
      const jitter = Math.sqrt(buf.reduce((a, b) => a + (b - avg) ** 2, 0) / buf.length);
      this.addLog(
        `STATS  frames=${this.frameCount}` +
        `  avg=${avg.toFixed(0)}ms` +
        `  jitter=±${jitter.toFixed(0)}ms` +
        `  dropped=${this.totalDropped}`,
      );
      this.intervalBuf = [];
    }
  }

  // ── Internal: emit to React at 4Hz ───────────────────────────────────────
  private startEmit(): void {
    this.emitTimer = setInterval(() => {
      if (this.latestFrame && this.updateHandler) {
        this.updateHandler({
          frame: this.latestFrame,
          stats: this.statsBuffer,
          logs:  this.logs,
        });
      }
    }, EMIT_INTERVAL);
  }

  private stopEmit(): void {
    if (this.emitTimer !== null) {
      clearInterval(this.emitTimer);
      this.emitTimer = null;
    }
  }

  // ── Internal: log ─────────────────────────────────────────────────────────
  private addLog(msg: string): void {
    const elapsed = ((performance.now() - this.sessionStart) / 1000).toFixed(3);
    this.logs = [...this.logs, `[+${elapsed}s] ${msg}`];
  }
}