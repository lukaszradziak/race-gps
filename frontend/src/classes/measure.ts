export interface MeasureRecord {
  speed: number;
  time: number;
  index: number;
  foundSpeed?: number;
  foundTime?: number;
}

export interface MeasureConfig {
  start: number;
  end: number;
  ready: boolean;
  started: boolean;
  records: MeasureRecord[];
  startIndex: number;
  measureTime?: number;
  speedTime?: Map<number, number>;
}

export interface MeasureResult {
  start: number;
  end: number;
  measureTime: number;
  speedTime: Map<number, number>;
}

export class Measure {
  private readonly ZERO_SPEED = 1;
  private config: MeasureConfig[] = [];
  private records: MeasureRecord[] = [];
  private lastResult: MeasureResult = {} as MeasureResult;
  private onNewResult: (result: MeasureResult) => void = () => {};

  public addConfig(start: number, end: number) {
    this.config.push({
      start,
      end,
      ready: false,
      started: false,
      records: [],
      startIndex: 0,
    });
  }

  public addRecord(speed: number, time: number) {
    const record: MeasureRecord = {
      speed: speed,
      time: time,
      index: this.records.length,
    };

    for (const configRow of this.config) {
      if (configRow.start === 0 && speed <= configRow.start + 1) {
        configRow.ready = true;
      }

      if (speed <= configRow.start) {
        configRow.ready = true;
      }

      if (speed > configRow.end) {
        configRow.ready = false;
      }

      if (!configRow.started && configRow.ready && speed > configRow.start) {
        configRow.started = true;
        configRow.records = this.records.slice(
          this.records.length - 5,
          this.records.length,
        );
        configRow.records.push(record);
      } else if (configRow.started && speed > configRow.end) {
        configRow.started = false;
        configRow.records.push(record);
        this.lastResult = this.parseResult(configRow);
        this.onNewResult(this.lastResult);
      } else if (configRow.started && speed <= configRow.end) {
        configRow.records.push(record);
      }
    }

    this.records.push(record);
  }

  public parseResult(configRow: MeasureConfig): MeasureResult {
    const speedTime = new Map<number, number>([]);

    for (let i = configRow.start; i <= configRow.end; i += 10) {
      speedTime.set(
        i,
        this.findSpeed(i === 0 ? this.ZERO_SPEED : i, configRow.records),
      );
    }

    return {
      start: configRow.start,
      end: configRow.end,
      measureTime:
        ((speedTime.get(configRow.end) || 0) -
          (speedTime.get(configRow.start) || 0)) /
        100,
      speedTime,
    };
  }

  public findSpeed(speed: number, records: MeasureRecord[]) {
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
    this.onNewResult = () => {};
    this.config = [];
    this.records = [];
    this.lastResult = {} as MeasureResult;
  }
}
