import { useEffect, useState } from "react";
import { Measure, MeasureResult } from "../classes/measure.ts";
const measure = new Measure();

export function useMeasure({
  onResult,
}: {
  onResult: (data: MeasureResult) => void;
}) {
  const [speed, setSpeed] = useState(0);
  const [time, setTime] = useState(0);

  const addRecord = (speed: number, time: number) => {
    setSpeed(speed);
    setTime(time);
    measure.addRecord(speed, time);
  };

  useEffect(() => {
    measure.addConfig(0, 60);
    measure.addConfig(0, 100);
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
