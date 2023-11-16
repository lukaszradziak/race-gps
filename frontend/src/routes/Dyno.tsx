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
    spacing: [10, 0, 15, 0],
  },
  title: {
    text: undefined,
  },
  xAxis: {
    categories: [],
    gridLineWidth: 1,
    tickInterval: 500,
  },
  yAxis: [{
    title: {
      text: undefined,
    },
    labels: {
      distance: 5,
    },
    min: 0,
    minorTicks: true,
    minorTicksPerMajor: 2,
  }],
  tooltip: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatter: function (): any {
      return '<table>' +
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        '<tr><td>Engine:</td><td>' + (this as any).x.toFixed(0) + ' rpm</td></tr>' +
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        '<tr><td>Speed:</td><td>' + (this as any).points[4].y.toFixed(0) + ' km/h</td></tr>' +
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        '<tr><td>Power:</td><td><b>' + (this as any).points[0].y.toFixed(0) + ' HP</b></td></tr>' +
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        '<tr><td>Torque:</td><td><b>' + (this as any).points[1].y.toFixed(0) + ' Nm</b></td></tr>' +
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        '<tr><td>Loss:</td><td>' + (this as any).points[3].y.toFixed(0) + ' HP</td></tr></table>';
    },
    shared: true,
    useHTML: true,
    valueDecimals: 2
  },
  series: [
    {
      name: "Power Avg (KM)",
      type: "line",
      data: [],
      color: "red",
      opacity: 1,
    },
    {
      // yAxis: 1,
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
    {
      name: "Speed (km/h)",
      type: "line",
      data: [],
      color: "green",
      opacity: 0.5,
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

      let powerData = records.map((record) => [record.engineSpeed, record.powerKmAvg2]);
      let torqueData = records.map((record) => [record.engineSpeed, record.torqueAvg2]);
      // Find elements in array with max HP and Nm
      let maxHPPoint = powerData.reduce((a, e) => a[1] >= e[1] ? a : e);
      let maxNmPoint = torqueData.reduce((a, e) => a[1] >= e[1] ? a : e);

      chart.series[0].setData(powerData);
      chart.series[1].setData(torqueData);
      chart.series[2].setData(records.map((record) => [record.engineSpeed, record.powerKmWithLoss]));
      chart.series[3].setData(records.map((record) => [record.engineSpeed, record.lossKm]));
      chart.series[4].setData(records.map((record) => [record.engineSpeed, record.speed]));

      chart.yAxis[0].update({
        max: Math.max(maxHPPoint[1], maxNmPoint[1]),
      });

      chart.setTitle({
        text: `${maxHPPoint[1].toFixed(0)} HP @ ${maxHPPoint[0].toFixed(0)}<br/>${maxNmPoint[1].toFixed(0)} Nm @ ${maxNmPoint[0].toFixed(0)}`,
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
