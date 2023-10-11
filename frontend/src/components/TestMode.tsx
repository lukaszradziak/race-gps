import { ChangeEvent, useState } from "react";
import { Card } from "./Card.tsx";
import { actualTime } from "../utils/number.ts";

export function TestMode({
  value,
  onChange,
}: {
  value: number;
  onChange: (speed: number, time: number) => void;
}) {
  const [startTime, setStartTime] = useState(0);

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();

    if (!event.target.files) {
      throw new Error("Problem with files");
    }

    fileReader.readAsText(event.target.files[0]);
    fileReader.onload = () => {
      if (!fileReader.result) {
        throw new Error("Empty file");
      }

      String(fileReader.result)
        .split("\n")
        .filter((_line, index) => index > 0)
        .forEach((line) => {
          const cols = line.split(",");
          onChange(parseFloat(cols[3]), parseInt(cols[0]));
        });
    };
  };

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
        className="w-full mb-4"
        min="-10"
        max="240"
        step="0.01"
        value={value}
        onChange={(event) =>
          onChange(parseFloat(event.target.value) || 0, actualTime())
        }
        onMouseDown={() => setStartTime(Date.now())}
      />
      <input type="file" onChange={handleFile} />
    </Card>
  );
}
