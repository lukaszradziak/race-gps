import { Card } from "../components/Card.tsx";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  basename,
  DynoCsv,
  parseDynoCsv,
  readAllFiles,
} from "../utils/file.ts";
import { useSettingReducer } from "../reducers/useSettingsReducer.ts";
import { Dyno } from "../classes/dyno.ts";
import { Switch } from "@headlessui/react";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import { dynoMultipleChart } from "../charts/dyno-multiple.chart.ts";

interface CsvModule {
  default: [];
}

enum DynoFileType {
  Uploaded = "uploaded",
  Example = "example",
}

interface DynoFileCustomSettings {
  weight: number;
  speedOn3000rpm: number;
  cx: number;
  frontalSurface: number;
  wheelLoss: number;
  powerFac: number;
  airDensity: number;
}

interface DynoFile {
  type: DynoFileType;
  data: DynoCsv[];
  customSettings?: DynoFileCustomSettings;
}

interface DynoDataFile extends DynoFile {
  active: boolean;
  dyno: Dyno;
}

export function DynoBrowser() {
  const chartComponentRef = useRef<HighchartsReact.RefObject>(null);
  const [settings] = useSettingReducer();
  const [files, setFiles] = useState<Map<string, DynoFile>>(new Map([]));
  const [dataFiles, setDataFiles] = useState<Map<string, DynoDataFile>>(
    new Map([]),
  );
  const [activeTab, setActiveTab] = useState<string>(
    Object.values(DynoFileType)[0],
  );

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) {
      throw new Error("File is not selected");
    }

    const readFiles = await readAllFiles(event.target.files);
    const tmpFiles = new Map<string, DynoFile>(files);

    readFiles.forEach((value, key) => {
      tmpFiles.set(key, {
        type: DynoFileType.Uploaded,
        data: parseDynoCsv(value),
      });
    });

    setFiles(tmpFiles);

    event.target.value = "";
  };

  const setDynoDataActive = (key: string, active: boolean) => {
    const tmpDataFiles = new Map<string, DynoDataFile>(dataFiles);
    const dataFile = tmpDataFiles.get(key);

    if (!dataFile) {
      throw new Error("DataFile not exists");
    }

    tmpDataFiles.set(key, {
      ...dataFile,
      active,
    });

    setDataFiles(tmpDataFiles);
  };

  useEffect(() => {
    (async () => {
      const modules = import.meta.glob("../data/example/dyno/*.csv");
      const tmpFiles = new Map<string, DynoFile>([]);

      for (const path in modules) {
        const data = (await modules[path]()) as CsvModule;
        const records: DynoCsv[] = data.default;
        let customSettings = undefined;

        if (
          records[0].speedOn3000rpm &&
          records[0].weight &&
          records[0].cx &&
          records[0].frontalSurface &&
          records[0].wheelLoss &&
          records[0].powerFac &&
          records[0].airDensity
        ) {
          customSettings = {
            speedOn3000rpm: parseFloat(records[0].speedOn3000rpm),
            weight: parseFloat(records[0].weight),
            cx: parseFloat(records[0].cx),
            frontalSurface: parseFloat(records[0].frontalSurface),
            wheelLoss: parseFloat(records[0].wheelLoss),
            powerFac: parseFloat(records[0].powerFac),
            airDensity: parseFloat(records[0].airDensity),
          };
        }

        tmpFiles.set(path, {
          type: DynoFileType.Example,
          data: records,
          customSettings,
        });
      }

      setFiles(tmpFiles);
    })();
  }, []);

  useEffect(() => {
    if (!files.size) {
      return;
    }

    const tmpDataFiles = new Map<string, DynoDataFile>([]);

    files.forEach((value, key) => {
      const dyno = new Dyno();

      if (value.customSettings) {
        dyno.setConfig(
          value.customSettings.weight,
          value.customSettings.speedOn3000rpm,
          value.customSettings.cx,
          value.customSettings.frontalSurface,
          value.customSettings.wheelLoss,
          value.customSettings.powerFac,
          value.customSettings.airDensity,
        );
      } else {
        dyno.setConfig(
          settings.weight,
          settings.speedOn3000rpm,
          settings.cx,
          settings.frontalSurface,
          settings.wheelLoss,
          settings.powerFac,
          settings.airDensity,
        );
      }

      value.data.forEach((data) => {
        dyno.addRecord(parseFloat(data.speed), data.time);
      });

      dyno.calculatePowerRecords();

      tmpDataFiles.set(key, {
        ...value,
        dyno,
        active: false,
      });
    });

    setDataFiles(tmpDataFiles);
  }, [settings, files]);

  useEffect(() => {
    if (!chartComponentRef.current?.chart) {
      return;
    }

    const chart = chartComponentRef.current.chart;

    while (chart.series.length > 0) {
      chart.series[0].remove(false);
    }

    const activeFiles = [...dataFiles].filter(([, value]) => value.active);

    if (!activeFiles.length) {
      return;
    }

    const maxPowerValue = Math.max(
      ...activeFiles.map(
        ([, dataFile]) => dataFile.dyno.getMaxPowerPoint().value,
      ),
    );
    const maxValue = Math.floor(Math.ceil((maxPowerValue + 1) / 40) * 40);

    chart.yAxis[0].update({
      max: maxValue * 2,
    });

    chart.yAxis[1].update({
      max: maxValue,
    });

    activeFiles.forEach(([path, dataFile]) => {
      chart.addSeries({
        name: `POWER HP (${basename(path)})`,
        type: "line",
        data: dataFile.dyno.getPowerData(),
        yAxis: 1,
        animation: false,
      });
      chart.addSeries({
        name: `TORQUE Nm (${basename(path)})`,
        type: "line",
        data: dataFile.dyno.getTorqueData(),
        visible: false,
        yAxis: 0,
        animation: false,
      });
    });
  }, [dataFiles]);

  return (
    <>
      <Card title="Dyno Browser">
        <input type="file" onChange={handleFile} multiple />
        <div>
          <div className="sm:hidden mt-5">
            <label htmlFor="tabs" className="sr-only">
              Select a tab
            </label>
            <select
              id="tabs"
              name="tabs"
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              defaultValue={Object.values(DynoFileType).find(
                (tabName) => tabName === activeTab,
              )}
              onChange={(event) => setActiveTab(event.target.value)}
            >
              {Object.values(DynoFileType).map((tabName) => (
                <option key={tabName}>{tabName}</option>
              ))}
            </select>
          </div>
          <div className="hidden sm:block">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {Object.values(DynoFileType).map((tabName) => (
                  <a
                    key={tabName}
                    href={`#${tabName}`}
                    className={`${
                      tabName === activeTab
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    aria-current={tabName === activeTab ? "page" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      setActiveTab(tabName);
                    }}
                  >
                    {tabName}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="pt-5">
          {![...dataFiles].filter(([, dataFile]) => {
            return dataFile.type === activeTab;
          }).length ? (
            <p className="text-sm text-gray-700">Empty</p>
          ) : null}

          <ul role="list" className="divide-y divide-gray-200">
            {[...dataFiles]
              .filter(([, dataFile]) => {
                return dataFile.type === activeTab;
              })
              .map(([path, dataFile]) => (
                <li key={path} className="flex py-4">
                  <Switch
                    checked={dataFile.active}
                    onChange={(value) => setDynoDataActive(path, value)}
                    className={`${
                      dataFile.active ? "bg-indigo-600" : "bg-gray-200"
                    } 
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                  >
                    <span
                      aria-hidden="true"
                      className={`${
                        dataFile.active ? "translate-x-5" : "translate-x-0"
                      }
                       pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </Switch>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {basename(path)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {dataFile.dyno.getMaxPowerPoint().value.toFixed(0)} HP @{" "}
                      {dataFile.dyno.getMaxPowerPoint().rpm.toFixed(0)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {dataFile.dyno.getMaxTorquePoint().value.toFixed(0)} Nm @{" "}
                      {dataFile.dyno.getMaxTorquePoint().rpm.toFixed(0)}
                    </p>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </Card>

      <Card>
        <HighchartsReact
          highcharts={Highcharts}
          options={dynoMultipleChart}
          ref={chartComponentRef}
        />
      </Card>
    </>
  );
}
