import { ChangeEvent, useState } from "react";
import { Card } from "./Card.tsx";

export function TestMode({
  value,
  onChange,
}: {
  value: number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const [startTime, setStartTime] = useState(0);

  return (
    <Card title="Test mode">
      <div className="text-center">
        {value.toFixed(2)}
        {startTime > 0 ? (
          <span>({((Date.now() - startTime) / 1000).toFixed(2)}s)</span>
        ) : null}
      </div>
      <input
        type="range"
        className="w-full"
        min="-10"
        max="240"
        step="0.01"
        value={value}
        onChange={onChange}
        onMouseDown={() => setStartTime(Date.now())}
      />
    </Card>
  );
}
