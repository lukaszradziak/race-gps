enum DynoRecordStatus {
  Power = "power",
  Loss = "loss",
}

interface DynoRecord {
  speed: number;
  time: number;
  alt?: number;
  satellites?: number;
  increment: boolean;
  decrement: boolean;
  status?: DynoRecordStatus;
  weight: number;
  speedMs: number;
  engineSpeed: number;
  measureTime: number;
  ek: number;
  powerKw: number;
  powerKm: number;
  torque: number;
  lossKm: number;
  powerKmWithLoss: number;
  torqueWithLoss: number;
  powerKmAvg: number;
  torqueAvg: number;
}

export class Dyno {
  private records: DynoRecord[] = [];
  private powerRecords: number = 0;
  private powerStarted: boolean = false;
  private powerEnded: boolean = false;
  private lossRecords: number = 0;
  private lossStarted: boolean = false;
  private lossEnded: boolean = false;
  private weight: number = 0;
  private speedOn3000rpm: number = 0;
  private cx: number = 0;
  private frontalSurface: number = 0;
  private testWheelLoss: number = 0;
  private airDensity: number = 0;

  public constructor(private minimumRecordsToMeasure: number = 20) {}

  public setConfig(
    weight: number,
    speedOn3000rpm: number,
    cx: number,
    frontalSurface: number,
    testWheelLoss: number,
    airDensity: number,
  ) {
    this.weight = weight;
    this.speedOn3000rpm = speedOn3000rpm;
    this.cx = cx;
    this.frontalSurface = frontalSurface;
    this.testWheelLoss = testWheelLoss;
    this.airDensity = airDensity;
  }

  public addRecord(
    speed: number,
    time: number,
    alt?: number,
    satellites?: number,
  ): void {
    const previousRecord = this.records[this.records.length - 1];

    this.records.push({
      speed,
      time,
      alt,
      satellites,
      increment: Math.floor(previousRecord?.speed) <= Math.floor(speed),
      decrement: Math.floor(previousRecord?.speed) >= Math.floor(speed),
      status: undefined,
      weight: 0,
      speedMs: 0,
      engineSpeed: 0,
      measureTime: 0,
      ek: 0,
      powerKw: 0,
      powerKm: 0,
      torque: 0,
      lossKm: 0,
      powerKmWithLoss: 0,
      torqueWithLoss: 0,
      powerKmAvg: 0,
      torqueAvg: 0,
    });

    this.parseRecords();
  }

  public getPowerRecords(): DynoRecord[] {
    const records: DynoRecord[] = [...this.records];

    for (const recordIndex in this.records) {
      const record = records[recordIndex];
      const previousRecord = records[parseInt(recordIndex) - 1];

      record.engineSpeed = (record.speed * 3000) / this.speedOn3000rpm;
      record.speedMs = record.speed * 0.277777778;
      record.ek = (this.weight * Math.pow(record.speedMs, 2)) / 2;
      record.measureTime = (record.time - (previousRecord?.time || 0)) / 100;
      const i = (record.ek - previousRecord?.ek) / record.measureTime;
      record.powerKw = i / 1000;
      record.powerKm = record.powerKw / 0.73549875;
      record.torque = (9549.3 * previousRecord?.powerKw) / record.engineSpeed;

      const wheelLossValue = this.testWheelLoss * Math.pow(record.speed, 2);
      const airLoss =
        0.0005 *
        this.cx *
        this.frontalSurface *
        this.airDensity *
        Math.pow(record.speedMs, 3) *
        1.359;

      record.powerKmWithLoss = record.powerKm + wheelLossValue + airLoss;
      record.torqueWithLoss =
        (9549.3 * record.powerKmWithLoss) / 1.36 / record.engineSpeed;
      record.lossKm = wheelLossValue + airLoss;
    }

    return records
      .map((record, index) => {
        return {
          ...record,
          powerKmAvg:
            (records[index - 2]?.powerKmWithLoss * 0.4 +
              records[index - 1]?.powerKmWithLoss * 0.6 +
              records[index]?.powerKmWithLoss +
              records[index + 1]?.powerKmWithLoss * 0.6 +
              records[index + 2]?.powerKmWithLoss * 0.4) /
            3,
          torqueAvg:
            (records[index - 2]?.torqueWithLoss * 0.4 +
              records[index - 1]?.torqueWithLoss * 0.6 +
              records[index]?.torqueWithLoss +
              records[index + 1]?.torqueWithLoss * 0.6 +
              records[index + 2]?.torqueWithLoss * 0.4) /
            3,
        };
      })
      .filter((record) => record.status === DynoRecordStatus.Power);
  }

  public getLossRecords(): DynoRecord[] {
    return this.records.filter(
      (record) => record.status === DynoRecordStatus.Loss,
    );
  }

  public reset() {
    this.records = [];
    this.powerRecords = 0;
    this.powerStarted = false;
    this.powerEnded = false;
    this.lossRecords = 0;
    this.lossStarted = false;
    this.lossEnded = false;
  }

  private parsePowerRecords(): void {
    const previousRecord = this.records[this.records.length - 2];
    const actualRecord = this.records[this.records.length - 1];

    if (previousRecord?.increment) {
      this.powerRecords++;
      this.lossRecords = 0;
    } else {
      this.powerRecords = 0;
    }

    if (!this.powerEnded && this.powerRecords >= this.minimumRecordsToMeasure) {
      this.powerStarted = true;
      actualRecord.status = DynoRecordStatus.Power;

      for (let i = 0; i <= this.powerRecords; i++) {
        this.records[this.records.length - 1 - i].status =
          DynoRecordStatus.Power;
      }
    }

    if (this.powerStarted && this.powerRecords < this.minimumRecordsToMeasure) {
      this.powerEnded = true;
    }
  }

  private parseLossRecords(): void {
    const previousRecord = this.records[this.records.length - 2];
    const actualRecord = this.records[this.records.length - 1];

    if (previousRecord?.decrement) {
      this.lossRecords++;
    } else {
      this.lossRecords = 0;
    }

    if (!this.lossEnded && this.lossRecords >= this.minimumRecordsToMeasure) {
      this.lossStarted = true;
      actualRecord.status = DynoRecordStatus.Loss;

      for (let i = 0; i < this.lossRecords; i++) {
        this.records[this.records.length - i - 1].status =
          DynoRecordStatus.Loss;
      }
    }

    if (this.lossStarted && this.lossRecords < this.minimumRecordsToMeasure) {
      this.lossEnded = true;
    }
  }

  private parseRecords(): void {
    if (!this.powerStarted || !this.powerEnded) {
      this.parsePowerRecords();
    }

    if (this.powerStarted && this.powerEnded) {
      this.parseLossRecords();
    }
  }
}
