import { ChangeEvent, useState } from "react";

export function TestSpeed({
  value,
  onChange,
}: {
  value: number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const [startTime, setStartTime] = useState(0);

  return (
    <>
      <div className="text-center">
        <span>Test speed: </span>
        <strong>{value.toFixed(2)}</strong>
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
    </>
  );
}
