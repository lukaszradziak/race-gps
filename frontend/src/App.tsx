import { useCallback, useRef, useState } from 'react';
import { BLEService, CMD, FIX_LABEL, sendAssist } from './ble/ble';
import type { BLEUpdate, AssistResult } from './ble/ble';
import { StabilityChart } from './ble/StabilityChart';
import './App.css';

type Status = 'disconnected' | 'connecting' | 'connected' | 'error';

const STATUS_LABEL: Record<Status, string> = {
  disconnected: 'Rozłączono',
  connecting:   'Łączenie…',
  connected:    'Połączono',
  error:        'Błąd połączenia',
};

function App() {
  const bleRef = useRef<BLEService | null>(null);

  const [status,   setStatus]   = useState<Status>('disconnected');
  const [update,   setUpdate]   = useState<BLEUpdate | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied,   setCopied]   = useState(false);
  const [assisting, setAssisting] = useState(false);
  const [assistResult, setAssistResult] = useState<AssistResult | null>(null);

  const connect = useCallback(async () => {
    setStatus('connecting');
    setUpdate(null);
    setErrorMsg(null);
    try {
      const ble = new BLEService()
        .onUpdate(data => setUpdate(data))
        .onConnect(() => setStatus('connected'))
        .onDisconnect(() => { setStatus('disconnected'); bleRef.current = null; });
      bleRef.current = ble;
      await ble.connect();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : String(err));
      bleRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => bleRef.current?.disconnect(), []);
  const ping       = useCallback(() => bleRef.current?.sendCommand(CMD.PING), []);

  const assist = useCallback(async () => {
    if (!bleRef.current) return;
    setAssisting(true);
    setAssistResult(null);
    const result = await sendAssist(bleRef.current);
    setAssistResult(result);
    setAssisting(false);
    setTimeout(() => setAssistResult(null), 8000);
  }, []);

  const downloadCSV = useCallback(() => bleRef.current?.downloadCSV(), []);
  const shareCSV    = useCallback(() => { bleRef.current?.shareCSV(); }, []);

  const canShare = !!navigator.canShare;

  const copyLogs = useCallback(async () => {
    const text = bleRef.current?.formatLogs() ?? update?.logs.join('\n') ?? '';
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [update]);

  const connected   = status === 'connected';
  const hasLogs     = (update?.logs.length ?? 0) > 0;
  const recordCount = update?.recordCount ?? 0;
  const recSec      = Math.round(recordCount / 25);
  const recLabel    = recSec < 60
    ? `${recSec} s`
    : `${Math.floor(recSec / 60)} min ${recSec % 60} s`;
  const frame       = update?.frame ?? null;

  const fixOk = frame && frame.fix >= 2;

  return (
    <section id="center">
      <h1>Race GPS</h1>

      <div className="ble-status" data-status={status}>
        <span className="ble-dot" />
        {STATUS_LABEL[status]}
      </div>

      <div className="ble-actions">
        {!connected ? (
          <button className="btn btn-primary" onClick={connect} disabled={status === 'connecting'}>
            {status === 'connecting' ? 'Łączenie…' : 'Połącz BLE'}
          </button>
        ) : (
          <>
            <button className="btn btn-ghost"   onClick={disconnect}>Rozłącz</button>
            <button className="btn btn-primary"  onClick={ping}>Ping</button>
            <button className="btn btn-assist"   onClick={assist} disabled={assisting}>
              {assisting ? 'Wysyłam…' : 'Asystuj GPS'}
            </button>
          </>
        )}
        {hasLogs && (
          <button className="btn btn-ghost" onClick={copyLogs}>
            {copied ? 'Skopiowano!' : 'Kopiuj logi'}
          </button>
        )}
        {recordCount > 0 && (
          <button className="btn btn-ghost" onClick={downloadCSV}>Pobierz CSV</button>
        )}
        {recordCount > 0 && canShare && (
          <button className="btn btn-ghost" onClick={shareCSV}>Udostępnij CSV</button>
        )}
      </div>

      {connected && recordCount > 0 && (
        <p className="record-status">
          <span className="record-dot" /> {recordCount.toLocaleString('pl-PL')} klatek ({recLabel})
        </p>
      )}

      {errorMsg && <p className="ble-error">{errorMsg}</p>}

      {assistResult && (
        <p className="ble-assist-result">
          {assistResult.time && <span className="assist-ok">czas UTC</span>}
          {assistResult.pos
            ? <span className="assist-ok">pozycja ±{assistResult.posAccuracy} m</span>
            : <span className="assist-warn">brak geolokalizacji</span>}
        </p>
      )}

      {frame && (
        <dl className="ble-frame">
          <div className="ble-frame-row ble-frame-big" data-ok={fixOk ? 'true' : 'false'}>
            <dt>Prędkość</dt>
            <dd>{frame.speed_kmh.toFixed(1)} km/h</dd>
          </div>
          <div className="ble-frame-row ble-frame-big">
            <dt>Przyspieszenie</dt>
            <dd>{frame.accel_mss.toFixed(2)} m/s²</dd>
          </div>
          <div className="ble-frame-row">
            <dt>Wysokość</dt>
            <dd>{frame.altitude_m.toFixed(1)} m</dd>
          </div>
          <div className="ble-frame-row">
            <dt>Dokładność</dt>
            <dd>{frame.hacc_m.toFixed(1)} m</dd>
          </div>
          <div className="ble-frame-row">
            <dt>Satelity</dt>
            <dd>{frame.sats}</dd>
          </div>
          <div className="ble-frame-row">
            <dt>Fix</dt>
            <dd>{FIX_LABEL[frame.fix] ?? frame.fix}</dd>
          </div>
          <div className="ble-frame-row">
            <dt>seq</dt>
            <dd>{frame.seq}</dd>
          </div>
        </dl>
      )}

      <StabilityChart stats={update?.stats ?? []} />
    </section>
  );
}

export default App;