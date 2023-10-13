import { Card } from "../components/Card.tsx";
import { TestMode } from "../components/TestMode.tsx";
import { useSettingReducer } from "../reducers/useSettingsReducer.ts";
import { useBluetooth } from "../hooks/useBluetooth.ts";
import { GpsData, parseGpsData } from "../utils/gps.ts";
import { Button } from "../components/Button.tsx";
import { useRef, useState } from "react";
import { Info } from "../components/Info.tsx";
import Highcharts from "highcharts";
import { useInterval } from "react-use";
import { Dyno as DynoClass } from "../classes/dyno.ts";
import { downloadFile } from "../utils/utils.ts";
import HighchartsReact from "highcharts-react-official";

const dyno = new DynoClass();
const chartOptions: Highcharts.Options = {
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
      name: "Power (KM)",
      type: "line",
      data: [],
      color: "red",
    },
    {
      yAxis: 1,
      name: "Torque (Nm)",
      type: "line",
      data: [],
      color: "blue",
    },
    {
      name: "Loss (KM)",
      type: "line",
      data: [],
      color: "orange",
    },
  ],
  plotOptions: {
    series: {
      marker: {
        enabled: false,
      },
    },
  },
};

export function Dyno() {
  const [speed, setSpeed] = useState(0);
  const [settings] = useSettingReducer();
  const chartRef = useRef<HighchartsReact.RefObject>(null);

  const { connect, disconnect, log, connected } = useBluetooth({
    handleData: (event: Event) => {
      const data: GpsData = parseGpsData(
        (event.target as BluetoothRemoteGATTCharacteristic).value,
      );
      setSpeed(data.speed);
    },
  });

  const handleTestSpeed = (speed: number, time: number) => {
    setSpeed(speed);
    dyno.addRecord(speed, time);
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

  useInterval(() => {
    const chart = chartRef.current?.chart;
    const records = dyno.getPowerRecords();

    if (!records.length || !chart) {
      return;
    }

    chart.series[0].setData(records.map((record) => record.powerKmAvg));
    chart.series[1].setData(records.map((record) => record.torqueAvg));
    chart.series[2].setData(records.map((record) => record.lossKm));
    chart.xAxis[0].update({
      categories: records.map((record) =>
        String(Math.floor(record.engineSpeed)),
      ),
    });
  }, 100);

  return (
    <>
      <Card title="Dyno">
        <div className="mt-1 text-8xl font-semibold tracking-tight text-gray-900 py-4 text-center">
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
        <HighchartsReact
          ref={chartRef}
          highcharts={Highcharts}
          options={chartOptions}
        />
        <Button onClick={downloadDynoCSV}>Export CSV</Button>
      </Card>

      {settings.testMode ? (
        <TestMode value={speed} onChange={handleTestSpeed} />
      ) : null}
    </>
  );
}
