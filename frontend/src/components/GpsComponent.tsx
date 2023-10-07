import { useState } from "react";
import { useBluetooth } from "../hooks/useBluetooth.ts";
import { useMeasure } from "../hooks/useMeasure.ts";
import { GpsData, parseGpsData } from "../utils/gps.ts";
import { MeasureResult } from "../classes/measure.ts";
import { downloadFile } from "../utils/utils.ts";

export function GpsComponent() {
  const [measureResult, setMeasureResult] = useState<MeasureResult[]>([]);
  const [gpsData, setGpsData] = useState<GpsData>({
    satellites: 0,
    alt: 0,
    time: 0,
    speed: 0,
  });
  const [csvData, setCsvData] = useState<GpsData[]>([]);

  const { speed, time, addRecord } = useMeasure({
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

  const handleTestSpeed = ({ target }: { target: HTMLInputElement }) => {
    addRecord(parseFloat(target.value) || 0, Math.floor(Date.now() / 10));
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
        <div className="log">{log}</div>
        {import.meta.env.DEV ? (
          <input
            type="range"
            className="test-speed"
            min="-10"
            max="300"
            step="0.01"
            value={speed}
            onChange={handleTestSpeed}
          />
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
