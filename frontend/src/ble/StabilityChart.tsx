import { useEffect, useRef } from 'react';
import type { FrameStat } from './ble';

const HISTORY    = 150;   // bars shown (~6s at 25Hz)
const TARGET_MS  = 40;
const MAX_MS     = 120;
const CHART_H    = 96;    // px

function barColor(stat: FrameStat): string {
  if (stat.dropped > 0) return '#ef4444';
  const d = Math.abs(stat.interval_ms - TARGET_MS);
  if (d < 8)  return '#22c55e';
  if (d < 20) return '#f59e0b';
  return '#ef4444';
}

function summary(stats: FrameStat[]) {
  const intervals = stats.map(s => s.interval_ms).filter(v => v > 0);
  if (!intervals.length) return null;
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const jitter = Math.sqrt(
    intervals.reduce((a, b) => a + (b - avg) ** 2, 0) / intervals.length,
  );
  const dropped = stats.reduce((a, s) => a + s.dropped, 0);
  return { avg, jitter, dropped };
}

function draw(
  canvas: HTMLCanvasElement,
  container: HTMLElement,
  stats: FrameStat[],
) {
  const dpr = window.devicePixelRatio || 1;
  const W   = container.clientWidth;
  const H   = CHART_H;

  canvas.width        = W * dpr;
  canvas.height       = H * dpr;
  canvas.style.width  = `${W}px`;
  canvas.style.height = `${H}px`;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  // grid lines at 40ms and 80ms
  const gridLines = [TARGET_MS, TARGET_MS * 2];
  gridLines.forEach(ms => {
    const y = H - (ms / MAX_MS) * H;
    ctx.strokeStyle = ms === TARGET_MS
      ? 'rgba(170, 59, 255, 0.35)'
      : 'rgba(128, 128, 128, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash(ms === TARGET_MS ? [4, 4] : [2, 4]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // bars — aligned to the right edge
  const barW = W / HISTORY;
  const startIdx = HISTORY - stats.length;

  stats.forEach((stat, i) => {
    const x       = (startIdx + i) * barW;
    const clipped = Math.min(stat.interval_ms, MAX_MS);
    const barH    = (clipped / MAX_MS) * H;

    ctx.fillStyle = barColor(stat);
    ctx.fillRect(x + 0.5, H - barH, Math.max(barW - 1, 1), barH);
  });
}

interface Props {
  stats: FrameStat[];
}

export function StabilityChart({ stats }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawRef      = useRef<() => void>(() => {});

  // keep drawRef current so ResizeObserver always uses latest stats
  useEffect(() => {
    drawRef.current = () => {
      const canvas    = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) draw(canvas, container, stats);
    };
    drawRef.current();
  }, [stats]);

  // single ResizeObserver, set up once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => drawRef.current());
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const s = summary(stats);

  return (
    <div className="ble-chart">
      <div className="ble-chart-stats">
        {s ? (
          <>
            <span>avg <strong>{s.avg.toFixed(0)} ms</strong></span>
            <span>jitter <strong>±{s.jitter.toFixed(0)} ms</strong></span>
            <span className={s.dropped > 0 ? 'stat-warn' : ''}>
              dropped <strong>{s.dropped}</strong>
            </span>
          </>
        ) : (
          <span className="stat-muted">oczekiwanie na ramki…</span>
        )}
      </div>
      <div ref={containerRef} className="ble-chart-canvas-wrap">
        <canvas ref={canvasRef} />
        <div className="ble-chart-labels">
          <span>{MAX_MS} ms</span>
          <span>{TARGET_MS} ms</span>
          <span>0</span>
        </div>
      </div>
    </div>
  );
}