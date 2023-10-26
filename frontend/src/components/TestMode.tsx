import { ChangeEvent, useState } from "react";
import { Card } from "./Card.tsx";
import { actualTime } from "../utils/number.ts";

export function TestMode({
  value,
  onChange,
  onFileUpload,
}: {
  value: number;
  onChange: (speed: number, time: string) => void;
  onFileUpload?: () => void;
}) {
  const [startTime, setStartTime] = useState(0);

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();

    if (!event.target.files?.length) {
      throw new Error("File is not selected");
    }

    fileReader.readAsText(event.target.files[0]);
    event.target.value = "";

    fileReader.onload = () => {
      if (!fileReader.result) {
        throw new Error("Empty file");
      }

      if (onFileUpload) {
        onFileUpload();
      }

      const lines = String(fileReader.result)
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line)
        .map((line) => line.split(","));

      const header = lines.shift() ?? [];
      const timeColumn = header.findIndex((value) => value === "time");
      const speedColumn = header.findIndex((value) => value === "speed");

      lines.forEach((line) => {
        onChange(parseFloat(line[speedColumn]), line[timeColumn]);
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
