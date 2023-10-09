import { ChangeEvent, useState } from "react";

export function TestSpeedComponent({
  value,
  onChange,
}: {
  value: number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const [startTime, setStartTime] = useState(0);

  return (
    <div>
      <div>
        <span>Test speed: </span>
        <strong>{value}</strong>
        {startTime > 0 ? (
          <span>({((Date.now() - startTime) / 1000).toFixed(2)}s)</span>
        ) : null}
      </div>
      <input
        type="range"
        className="test-speed"
        min="-10"
        max="300"
        step="0.01"
        value={value}
        onChange={onChange}
        onMouseDown={() => setStartTime(Date.now())}
      />
    </div>
  );
}
