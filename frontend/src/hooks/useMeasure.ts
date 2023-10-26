import { useEffect, useState } from "react";
import { Measure, MeasureResult } from "../classes/measure.ts";
const measure = new Measure();

interface useMeasureParam {
  speedConfig: [number, number][];
  onResult: (data: MeasureResult) => void;
}

export function useMeasure({ speedConfig, onResult }: useMeasureParam) {
  const [speed, setSpeed] = useState(0);
  const [time, setTime] = useState("");

  const addRecord = (speed: number, time: string) => {
    setSpeed(speed);
    setTime(time);
    measure.addRecord(speed, time);
  };

  useEffect(() => {
    speedConfig.forEach((config) => {
      measure.addConfig(config[0], config[1]);
    });
    measure.handleNewResult(onResult);

    return () => {
      measure.destroy();
    };
    // eslint-disable-next-line
  }, []); // TODO: add Event to measure

  return {
    speed,
    time,
    addRecord,
  };
}
