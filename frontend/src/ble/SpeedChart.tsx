import { useEffect, useRef } from 'react';

const HISTORY = 150;
const CHART_H = 96;

function summary(speeds: number[]) {
  if (speeds.length === 0) return null;
  const current = speeds[speeds.length - 1];
  const max     = Math.max(...speeds);
  const scale   = Math.max(Math.ceil(max / 50) * 50, 60);
  return { current, max, scale };
}

function draw(canvas: HTMLCanvasElement, container: HTMLElement, speeds: number[]) {
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

  if (speeds.length === 0) return;

  const maxVal = Math.max(...speeds);
  const scale  = Math.max(Math.ceil(maxVal / 50) * 50, 60);

  // Grid lines at 50 km/h intervals
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 4]);
  for (let v = 50; v <= scale; v += 50) {
    const y = H - (v / scale) * H;
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Points — right-aligned, same convention as StabilityChart
  const slotW    = W / HISTORY;
  const startIdx = HISTORY - speeds.length;
  const pts      = speeds.map((v, i) => ({
    x: (startIdx + i + 0.5) * slotW,
    y: H - (v / scale) * H,
  }));

  // Filled area under the curve
  ctx.beginPath();
  ctx.moveTo(pts[0].x, H);
  for (const p of pts) ctx.lineTo(p.x, p.y);
  ctx.lineTo(pts[pts.length - 1].x, H);
  ctx.closePath();
  ctx.fillStyle = 'rgba(99, 102, 241, 0.18)';
  ctx.fill();

  // Speed line
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (const p of pts) ctx.lineTo(p.x, p.y);
  ctx.strokeStyle = '#818cf8';
  ctx.lineWidth   = 1.5;
  ctx.lineJoin    = 'round';
  ctx.stroke();
}

interface Props {
  speedHistory: number[];
}

export function SpeedChart({ speedHistory }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawRef      = useRef<() => void>(() => {});

  useEffect(() => {
    drawRef.current = () => {
      const canvas    = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) draw(canvas, container, speedHistory);
    };
    drawRef.current();
  }, [speedHistory]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => drawRef.current());
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const s = summary(speedHistory);

  return (
    <div className="ble-chart">
      <div className="ble-chart-stats">
        {s ? (
          <>
            <span>teraz <strong>{s.current.toFixed(1)} km/h</strong></span>
            <span>max <strong>{s.max.toFixed(1)} km/h</strong></span>
          </>
        ) : (
          <span className="stat-muted">oczekiwanie na prędkość…</span>
        )}
      </div>
      <div ref={containerRef} className="ble-chart-canvas-wrap">
        <canvas ref={canvasRef} />
        <div className="ble-chart-labels">
          <span>{s?.scale ?? '—'} km/h</span>
          <span>0</span>
        </div>
      </div>
    </div>
  );
}