import { Card } from "../components/Card.tsx";
import { TestMode } from "../components/TestMode.tsx";
import { useSettingReducer } from "../reducers/useSettingsReducer.ts";
import { useBluetooth } from "../hooks/useBluetooth.ts";
import { GpsData, parseGpsData } from "../utils/gps.ts";
import { Button } from "../components/Button.tsx";
import { useEffect, useRef, useState } from "react";
import { Info } from "../components/Info.tsx";
import { Dyno as DynoClass } from "../classes/dyno.ts";
import { downloadFile } from "../utils/file.ts";
import { useDebounce } from "react-use";
import { dynoChart } from "../charts/dyno.chart.ts";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

const dyno = new DynoClass();

export function Dyno() {
  const [speed, setSpeed] = useState(0);
  const [settings] = useSettingReducer();
  const chartComponentRef = useRef<HighchartsReact.RefObject>(null);

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
      dyno.calculatePowerRecords();
      const records = dyno.getPowerRecords();

      if (!records.length || !chartComponentRef.current?.chart) {
        return;
      }

      // Find elements in array with max HP and Nm
      const maxHPPoint = dyno.getMaxPowerPoint();
      const maxNmPoint = dyno.getMaxTorquePoint();
      const chart = chartComponentRef.current.chart;

      chart.series[0].setData(dyno.getPowerData());
      chart.series[1].setData(dyno.getTorqueData());
      chart.series[2].setData(
        records.map((record) => [record.engineSpeed, record.powerKmWithLoss]),
      );
      chart.series[3].setData(
        records.map((record) => [record.engineSpeed, record.lossKm]),
      );
      chart.series[4].setData(
        records.map((record) => [record.engineSpeed, record.speed]),
      );
      chart.yAxis[0].update({
        max: Math.max(maxHPPoint.value, maxNmPoint.value),
      });
      chart.setTitle({
        text: `${maxHPPoint.value.toFixed(0)} HP @ ${maxHPPoint.rpm.toFixed(
          0,
        )}<br/>${maxNmPoint.value.toFixed(0)} Nm @ ${maxNmPoint.rpm.toFixed(
          0,
        )}`,
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
  }, [settings]);

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
        <HighchartsReact
          highcharts={Highcharts}
          options={dynoChart}
          ref={chartComponentRef}
        />
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
