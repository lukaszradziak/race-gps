import { useCallback, useRef, useState } from 'react';
import { BLEService, CMD } from './ble/ble';
import type { BLEUpdate } from './ble/ble';
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
      const msg = err instanceof Error ? err.message : String(err);
      setStatus('error');
      setErrorMsg(msg);
      bleRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => bleRef.current?.disconnect(), []);

  const ping = useCallback(() => bleRef.current?.sendCommand(CMD.PING), []);

  const copyLogs = useCallback(async () => {
    const text = bleRef.current?.formatLogs() ?? update?.logs.join('\n') ?? '';
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [update]);

  const connected = status === 'connected';
  const hasLogs   = (update?.logs.length ?? 0) > 0;

  return (
    <section id="center">
      <h1>Race GPS</h1>

      <div className="ble-status" data-status={status}>
        <span className="ble-dot" />
        {STATUS_LABEL[status]}
      </div>

      <div className="ble-actions">
        {!connected ? (
          <button
            className="btn btn-primary"
            onClick={connect}
            disabled={status === 'connecting'}
          >
            {status === 'connecting' ? 'Łączenie…' : 'Połącz BLE'}
          </button>
        ) : (
          <>
            <button className="btn btn-ghost" onClick={disconnect}>Rozłącz</button>
            <button className="btn btn-primary" onClick={ping}>Ping</button>
          </>
        )}
        {hasLogs && (
          <button className="btn btn-ghost" onClick={copyLogs}>
            {copied ? 'Skopiowano!' : 'Kopiuj logi'}
          </button>
        )}
      </div>

      {errorMsg && <p className="ble-error">{errorMsg}</p>}

      {update && (
        <dl className="ble-frame">
          <div className="ble-frame-row">
            <dt>seq</dt>
            <dd>{update.frame.seq}</dd>
          </div>
          <div className="ble-frame-row">
            <dt>timestamp</dt>
            <dd>{update.frame.timestamp_ms} ms</dd>
          </div>
        </dl>
      )}

      <StabilityChart stats={update?.stats ?? []} />
    </section>
  );
}

export default App;