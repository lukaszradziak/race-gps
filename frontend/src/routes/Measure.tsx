import { useState } from "react";
import { useBluetooth } from "../hooks/useBluetooth.ts";
import { useMeasure } from "../hooks/useMeasure.ts";
import { GpsData, parseGpsData } from "../utils/gps.ts";
import { MeasureResult } from "../classes/measure.ts";
import { downloadFile } from "../utils/file.ts";
import { TestMode } from "../components/TestMode.tsx";
import { Card } from "../components/Card.tsx";
import { Button } from "../components/Button.tsx";
import { Info } from "../components/Info.tsx";
import { useSettingReducer } from "../reducers/useSettingsReducer.ts";
import { Modal } from "../components/Modal.tsx";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { measureChart } from "../charts/measure.chart.ts";

function generateApiName() {
  return new Date().toISOString().replace(/([:.])/g, "-");
}

export function Measure() {
  const [settings] = useSettingReducer();
  const [measureResult, setMeasureResult] = useState<MeasureResult[]>([]);
  const [gpsData, setGpsData] = useState<GpsData>({
    satellites: 0,
    alt: 0,
    time: "",
    speed: 0,
  });
  const [csvData, setCsvData] = useState<GpsData[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMeasure, setModalMeasure] = useState<MeasureResult>();
  // TODO: to external component
  const [apiName] = useState<string>(generateApiName());
  const [apiLoading, setApiLoading] = useState<boolean>(false);
  const [apiInfo, setApiInfo] = useState<string>("");

  const { speed, time, addRecord } = useMeasure({
    speedConfig: settings.speed.map((speed) => [speed.start, speed.end]),
    onResult: (data: MeasureResult) => {
      setMeasureResult((previousMeasureResult) => [
        ...previousMeasureResult,
        data,
      ]);
    },
  });

  const { connect, disconnect, log, connected } = useBluetooth({
    handleData: (event: Event) => {
      const data: GpsData = parseGpsData(
        (event.target as BluetoothRemoteGATTCharacteristic).value,
      );
      addRecord(data.speed, data.time, data.alt);
      setGpsData(data);
      setCsvData((previousCsvData) => [...previousCsvData, data]);
    },
  });

  const getCsv = (): string => {
    if (!csvData.length) {
      return "";
    }

    return (
      Object.keys(csvData[0]).join(",") +
      "\n" +
      csvData.map((data) => Object.values(data).join(",")).join("\n")
    );
  };

  const handleDownloadCsv = () => {
    downloadFile(getCsv(), `race-gps-raw-data-${Date.now()}.csv`);
  };

  const handleTestSpeed = (speed: number, time: string, alt?: number) => {
    addRecord(speed, time, alt);
  };

  const uploadToApi = async () => {
    const csvData = getCsv();

    if (!csvData.length) {
      // return;
    }

    setApiLoading(true);

    await fetch(settings.apiUrl, {
      method: "POST",
      body: JSON.stringify({
        name: apiName,
        data: csvData,
      }),
    });

    const response = await fetch(settings.apiUrl);
    const json = await response.json();
    setApiInfo(json.files.length);

    setApiLoading(false);
  };

  return (
    <>
      <Card>
        <div className="flex flex-col justify-center items-center mb-2">
          <div className="flex justify-between w-full text-sm">
            <span className="flex gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
                />
              </svg>
              {Math.floor(gpsData.alt / 100)}m
            </span>
            <span className="flex gap-1" onClick={handleDownloadCsv}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
                />
              </svg>

              {csvData.length}
            </span>
            <span className="flex gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"
                />
              </svg>
              {gpsData.satellites}/12
            </span>
          </div>
          <span className="mt-1 text-8xl font-semibold tracking-tight text-gray-900 py-4">
            {Math.floor(speed)}
          </span>
          <div className="relative flex py-5 items-center w-full">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-gray-400">
              {String(time)
                .match(/.{1,2}/g)
                ?.join(":")}
            </span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>
          <div className="flex flex-col w-full">
            {connected ? (
              <Button onClick={() => disconnect()} size="lg">
                Disconnect
              </Button>
            ) : (
              <Button onClick={() => connect()} size="lg">
                Connect
              </Button>
            )}
          </div>
        </div>
        {log ? <Info>{log}</Info> : null}
      </Card>
      {settings.apiEnabled ? (
        <Button
          className="mb-2"
          variant="white"
          onClick={uploadToApi}
          disabled={apiLoading}
        >
          {apiLoading ? `Loading...` : `Sync with API`}{" "}
          {apiInfo ? `(${apiInfo})` : null}
        </Button>
      ) : null}
      {settings.testMode ? (
        <TestMode value={speed} onChange={handleTestSpeed} />
      ) : null}
      {[...measureResult].reverse().map((measure, index) => (
        <Card
          key={index}
          onClick={() => {
            setModalOpen(true);
            setModalMeasure(measure);
          }}
          className="cursor-pointer hover:bg-gray-50"
        >
          <div className="flex justify-between">
            <strong>
              {measure.start} - {measure.end}
            </strong>
            <span>{measure.measureTime.toFixed(2)}s</span>
          </div>
        </Card>
      ))}
      <Modal open={modalOpen} setOpen={setModalOpen}>
        {modalMeasure ? (
          <>
            <HighchartsReact
              highcharts={Highcharts}
              options={measureChart}
              callback={(chart: Highcharts.Chart) => {
                chart.series[0].setData(
                  modalMeasure.records.map((record) => [
                    ((record.time - modalMeasure.startTime) / 100).toFixed(2),
                    ((record.altAvg ?? 0) - modalMeasure.startAlt) / 100,
                  ]),
                );
                chart.series[1].setData(
                  modalMeasure.records.map((record) => [
                    ((record.time - modalMeasure.startTime) / 100).toFixed(2),
                    record.speed,
                  ]),
                );
                chart.xAxis[0].options.tickInterval =
                  (modalMeasure.measureTime + 0.04) * 2.5;
              }}
            />
            <div className="grid grid-cols-2 gap-x-6">
              {[...modalMeasure.speedTime]
                .filter((speedTime) => speedTime[0] > modalMeasure.start)
                .map((speedTime, index) => (
                  <div key={index} className="flex justify-between">
                    <span>
                      {modalMeasure.start} - {speedTime[0]}
                    </span>
                    <span>{(speedTime[1] / 100).toFixed(2)}s</span>
                  </div>
                ))}
            </div>
          </>
        ) : null}
      </Modal>
    </>
  );
}
