import { ChangeEvent, useState } from "react";
import { useBluetooth } from "../hooks/useBluetooth.ts";
import { useMeasure } from "../hooks/useMeasure.ts";
import { GpsData, parseGpsData } from "../utils/gps.ts";
import { MeasureResult } from "../classes/measure.ts";
import { downloadFile } from "../utils/utils.ts";
import { TestSpeedComponent } from "../components/TestSpeedComponent.tsx";

export function Measure() {
  const [measureResult, setMeasureResult] = useState<MeasureResult[]>([]);
  const [gpsData, setGpsData] = useState<GpsData>({
    satellites: 0,
    alt: 0,
    time: 0,
    speed: 0,
  });
  const [csvData, setCsvData] = useState<GpsData[]>([]);

  const { speed, time, addRecord } = useMeasure({
    speedConfig: [
      [0, 60],
      [0, 100],
      [100, 150],
      [100, 200],
    ],
    onResult: (data: MeasureResult) => {
      setMeasureResult((previousMeasureResult) => [
        ...previousMeasureResult,
        data,
      ]);
    },
  });

  const { connect, disconnect, log } = useBluetooth({
    handleData: (event: Event) => {
      const data: GpsData = parseGpsData(
        (event.target as BluetoothRemoteGATTCharacteristic).value,
      );
      addRecord(data.speed, data.time);
      setGpsData(data);
      setCsvData((previousCsvData) => [...previousCsvData, data]);
    },
  });

  const handleConnect = () => {
    connect();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleDownloadCsv = () => {
    downloadFile(
      Object.keys(csvData[0]).join(",") +
        "\n" +
        csvData.map((data) => Object.values(data).join(",")).join("\n"),
      `race-gps-raw-data-${Date.now()}.csv`,
    );
  };

  const handleTestSpeed = (event: ChangeEvent<HTMLInputElement>) => {
    addRecord(parseFloat(event.target.value) || 0, Math.floor(Date.now() / 10));
  };

  // TODO: modal with graph

  return (
    <>
      <div className="card">
        <div className="data">
          <h2>{Math.floor(speed)}</h2>
          <p>
            S: {gpsData.satellites} A: {gpsData.alt}
          </p>
          <p>
            {String(time)
              .match(/.{1,2}/g)
              ?.join(":")}
          </p>
        </div>
        <div className="real-time">
          {new Date().toLocaleTimeString()}:{new Date().getMilliseconds()}
        </div>
        <button className="connect" onClick={handleConnect}>
          Connect
        </button>
        <button className="disconnect" onClick={handleDisconnect}>
          Disconnect
        </button>
        <button className="csv" onClick={handleDownloadCsv}>
          Download CSV ({csvData.length})
        </button>
        <div className="log" data-testid="log">
          {log}
        </div>
        {import.meta.env.DEV ? (
          <TestSpeedComponent value={speed} onChange={handleTestSpeed} />
        ) : null}
        {measureResult.reverse().map((measure, index) => (
          <li key={index}>
            {measure.start}-{measure.end}: {measure.measureTime.toFixed(2)}s
          </li>
        ))}
      </div>
      <div className="modal-bg">
        <div className="modal"></div>
      </div>
    </>
  );
}
