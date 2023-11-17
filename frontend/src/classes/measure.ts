import { weightedAverageValues, parseToTime } from "../utils/number.ts";

export interface MeasureRecord {
  speed: number;
  time: number;
  index: number;
  foundSpeed?: number;
  foundTime?: number;
  alt?: number;
  altAvg?: number;
}

export interface MeasureConfig {
  start: number;
  end: number;
  ready: boolean;
  started: boolean;
  records: MeasureRecord[];
  measureTime?: number;
  speedTime?: Map<number, number>;
}

export interface MeasureResult {
  start: number;
  end: number;
  startAlt: number;
  startTime: number;
  measureTime: number;
  speedTime: Map<number, number>;
  records: MeasureRecord[];
}

export class Measure {
  private readonly ZERO_SPEED = 1;
  private config: MeasureConfig[] = [];
  private records: MeasureRecord[] = [];
  private lastResult: MeasureResult = {} as MeasureResult;
  private onNewResult: (result: MeasureResult) => void = () => { };

  public addConfig(start: number, end: number) {
    this.config.push({
      start,
      end,
      ready: false,
      started: false,
      records: [],
    });
  }

  public addRecord(speed: number, time: string, alt?: number) {
    const record: MeasureRecord = {
      speed: speed,
      time: parseToTime(time),
      index: this.records.length,
      alt: alt,
    };

    for (const configRow of this.config) {
      if (configRow.start === 0 && speed <= configRow.start + 1) {
        configRow.ready = true;
        configRow.records = [];
      }

      if (speed <= configRow.start) {
        configRow.ready = true;
        configRow.records = [];
      }

      if (speed > configRow.end) {
        configRow.ready = false;
      }

      if (!configRow.started && configRow.ready && speed > configRow.start) {
        configRow.started = true;
        configRow.records = this.records.slice(-1);
        configRow.records.push({ ...record });
      } else if (configRow.started && speed > configRow.end) {
        configRow.started = false;
        configRow.records.push({ ...record });
        this.lastResult = this.parseResult(configRow);
        this.onNewResult(this.lastResult);
      } else if (configRow.started && speed <= configRow.end) {
        configRow.records.push({ ...record });
      }
    }

    this.records.push(record);
  }

  public parseResult(configRow: MeasureConfig): MeasureResult {
    const speedTime = new Map<number, number>([]);
    let startTime = 0;

    const avgMatrix = [
      { idx: -4, w: 0.4 },
      { idx: -3, w: 0.6 },
      { idx: -2, w: 0.8 },
      { idx: -1, w: 1 },
      { idx: 0, w: 1 },
      { idx: 1, w: 1 },
      { idx: 2, w: 0.8 },
      { idx: 3, w: 0.6 },
      { idx: 4, w: 0.4 }
    ];
    configRow.records.forEach((_record, index) => {
      configRow.records[index].altAvg = weightedAverageValues(
        configRow.records.map((record) => record.alt),
        index,
        avgMatrix,
      );
    });

    let startRecord = configRow.records.find(_record =>
      _record.speed >= configRow.start
    );
    let startAlt = startRecord?.altAvg ?? 0;

    for (let i = configRow.start; i <= configRow.end; i += 10) {
      const time = this.findTimeForSpeed(
        i === 0 ? this.ZERO_SPEED : i,
        configRow.records,
      );

      if (i === configRow.start) {
        startTime = time;
      }

      speedTime.set(i, time - startTime);
    }

    const firstFoundSpeedIndex = configRow.records.findIndex(
      (record) =>
        record.foundSpeed !== undefined && record.foundSpeed >= 0,
    );
    startTime = configRow.records[firstFoundSpeedIndex].foundTime ?? 0;

    return {
      start: configRow.start,
      end: configRow.end,
      startAlt: startAlt,
      startTime: startTime,
      measureTime:
        ((speedTime.get(configRow.end) || 0) -
          (speedTime.get(configRow.start) || 0)) /
        100,
      speedTime,
      records: configRow.records,
    };
  }

  public findTimeForSpeed(speed: number, records: MeasureRecord[]) {
    let interpolateResult = 0;
    let foundRecord;

    for (const index in records) {
      const previousRecord = records[parseInt(index) - 1];
      const actualRecord = records[index];

      if (!previousRecord) {
        continue;
      }

      if (actualRecord.speed > speed && previousRecord.speed <= speed) {
        interpolateResult =
          actualRecord.time -
          ((actualRecord.time - previousRecord.time) *
            (actualRecord.speed - speed)) /
          (actualRecord.speed - previousRecord.speed);
        foundRecord = actualRecord;
      }
    }

    if (foundRecord) {
      foundRecord.foundSpeed = speed;
      foundRecord.foundTime = interpolateResult;
    }

    return interpolateResult;
  }

  public getLastResult() {
    return this.lastResult;
  }

  public handleNewResult(callback: (data: MeasureResult) => void) {
    this.onNewResult = callback;
    this.records = [];
  }

  public destroy() {
    this.onNewResult = () => { };
    this.config = [];
    this.records = [];
    this.lastResult = {} as MeasureResult;
  }
}
