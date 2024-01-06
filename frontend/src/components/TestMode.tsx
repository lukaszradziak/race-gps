import { ChangeEvent, useState } from "react";
import { Card } from "./Card.tsx";
import { actualTime } from "../utils/number.ts";
import { Modal } from "./Modal.tsx";
import { Button } from "./Button.tsx";
import { useSettingReducer } from "../reducers/useSettingsReducer.ts";

export function TestMode({
  value,
  onChange,
  onFileUpload,
}: {
  value: number;
  onChange: (speed: number, time: string, alt?: number) => void;
  onFileUpload?: () => void;
}) {
  const [startTime, setStartTime] = useState(0);
  const [settings] = useSettingReducer();
  const [apiModalOpen, setApiModalOpen] = useState<boolean>(false);
  const [apiFiles, setApiFiles] = useState<string[]>([]);

  const parseCsv = (csv: string) => {
    const lines = String(csv)
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line)
      .map((line) => line.split(","));

    const header = lines.shift() ?? [];
    const timeColumn = header.findIndex((value) => value === "time");
    const speedColumn = header.findIndex((value) => value === "speed");
    const altColumn = header.findIndex((value) => value === "alt");

    return lines.map((line) => {
      return {
        speed: parseFloat(line[speedColumn]),
        time: line[timeColumn],
        alt: parseInt(line[altColumn] ?? 0),
      };
    });
  };

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

      parseCsv(String(fileReader.result)).forEach((row) => {
        onChange(row.speed, row.time, row.alt);
      });
    };
  };

  const openApiModal = async () => {
    setApiModalOpen(true);

    const response = await fetch(settings.apiUrl);
    const json = await response.json();
    setApiFiles(json.files);
  };

  const selectApiFile = async (apiFile: string) => {
    setApiModalOpen(false);

    const response = await fetch(`${settings.apiUrl}/${apiFile}`);
    const json = await response.json();

    parseCsv(json.file).forEach((row) => {
      onChange(row.speed, row.time, row.alt);
    });
  };

  return (
    <>
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
        <Button onClick={openApiModal} variant="white">
          Download from API
        </Button>
      </Card>
      <Modal open={apiModalOpen} setOpen={setApiModalOpen}>
        select files
        {apiFiles.map((apiFile, index) => (
          <li key={index}>
            <a href="#" onClick={() => selectApiFile(apiFile)}>
              {apiFile}
            </a>
          </li>
        ))}
      </Modal>
    </>
  );
}
