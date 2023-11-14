import { Card } from "../components/Card.tsx";
import { TestMode } from "../components/TestMode.tsx";
import { useSettingReducer } from "../reducers/useSettingsReducer.ts";
import { useBluetooth } from "../hooks/useBluetooth.ts";
import { GpsData, parseGpsData } from "../utils/gps.ts";
import { Button } from "../components/Button.tsx";
import { useEffect, useState } from "react";
import { Info } from "../components/Info.tsx";
import { Dyno as DynoClass } from "../classes/dyno.ts";
import { downloadFile } from "../utils/file.ts";
import { useDebounce } from "react-use";
import Highcharts from "highcharts";

const dyno = new DynoClass();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chartOptions: any = {
  chart: {
    renderTo: "chart",
  },
  title: {
    text: undefined,
  },
  xAxis: {
    categories: [],
  },
  yAxis: [
    {
      title: {
        text: "Torque (Nm)",
      },
      min: 0,
    },
    {
      opposite: true,
      title: {
        text: "Power (KM)",
      },
      min: 0,
    },
  ],
  series: [
    {
      name: "Power Avg (KM)",
      type: "line",
      data: [],
      color: "red",
      opacity: 1,
    },
    {
      yAxis: 1,
      name: "Torque Avg (Nm)",
      type: "line",
      data: [],
      color: "blue",
      opacity: 1,
    },
    {
      name: "Power (KM)",
      type: "line",
      data: [],
      color: "red",
      opacity: 0.1,
    },
    {
      name: "Loss (KM)",
      type: "line",
      data: [],
      color: "orange",
      opacity: 0.6,
    },
  ],
  plotOptions: {
    series: {
      marker: {
        enabled: false,
      },
    },
  },
  accessibility: {
    enabled: false,
  },
};

export function Dyno() {
  const [speed, setSpeed] = useState(0);
  const [settings] = useSettingReducer();
  const [chart, setChart] = useState<Highcharts.Chart>();

  const { connect, disconnect, log, connected } = useBluetooth({
    handleData: (event: Event) => {
      const data: GpsData = parseGpsData(
        (event.target as BluetoothRemoteGATTCharacteristic).value,
      );
      setSpeed(data.speed);
    },
  });

  useDebounce(
    () => {
      const records = dyno.getPowerRecords();

      if (!records.length || !chart) {
        return;
      }

      chart.series[0].setData(records.map((record) => record.powerKmAvg2));
      chart.series[1].setData(records.map((record) => record.torqueAvg2));
      chart.series[2].setData(records.map((record) => record.powerKmWithLoss));
      chart.series[3].setData(records.map((record) => record.lossKm));
      chart.xAxis[0].update({
        categories: records.map((record) =>
          String(Math.floor(record.engineSpeed)),
        ),
      });
      chart.setTitle({
        text: `${Math.floor(chart.series[0].dataMax || 0)} KM / ${Math.floor(
          chart.series[1].dataMax || 0,
        )} Nm`,
      });
    },
    100,
    [speed],
  );

  const handleTestSpeed = (speed: number, time: string) => {
    setSpeed(speed);
    dyno.addRecord(speed, time);
  };

  const handleTestFileUpload = () => {
    dyno.reset();
  };

  const downloadDynoCSV = () => {
    const records = dyno.getPowerRecords();

    if (!records.length) {
      return;
    }

    downloadFile(
      Object.keys(records[0]).join(",") +
        "\n" +
        records.map((data) => Object.values(data).join(",")).join("\n"),
      `race-gps-dyno-data-${Date.now()}.csv`,
    );
  };

  useEffect(() => {
    dyno.setConfig(
      settings.weight,
      settings.speedOn3000rpm,
      settings.cx,
      settings.frontalSurface,
      settings.testWheelLoss,
      settings.airDensity,
    );

    if (!chart) {
      setChart(Highcharts.chart(chartOptions));
    }
  }, [chart, settings]);

  return (
    <>
      <Card title="Dyno">
        <div className="mt-1 text-4xl font-semibold tracking-tight text-gray-900 py-4 text-center">
          {Math.floor(speed)}
        </div>
        <div className="flex flex-col w-full">
          {connected ? (
            <Button onClick={() => connect()} size="lg">
              Disconnect
            </Button>
          ) : (
            <Button onClick={() => disconnect()} size="lg">
              Connect
            </Button>
          )}
        </div>
        {log ? <Info>{log}</Info> : null}
      </Card>

      <Card>
        <div id="chart"></div>
        <Button onClick={downloadDynoCSV}>Export CSV</Button>
      </Card>

      {settings.testMode ? (
        <TestMode
          value={speed}
          onChange={handleTestSpeed}
          onFileUpload={handleTestFileUpload}
        />
      ) : null}
    </>
  );
}
