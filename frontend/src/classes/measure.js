export class Measure {
  config = [];
  records = [];
  onNewResult = () => {};

  constructor (onNewResult = () => {}) {
    this.onNewResult = onNewResult;
  }

  addConfig (start, end) {
    this.config.push({
      start,
      end,
      ready: false,
      started: false,
      records: [],
      previousRecords: [],
      startIndex: 0
    });
  }

  addRecord (speed, time) {
    const record = {
      speed: parseFloat(speed),
      time: parseInt(time),
      index: this.records.length
    };

    for (const configRow of this.config) {
      if (speed <= configRow.start) {
        configRow.ready = true;
      }

      if (speed > configRow.end) {
        configRow.ready = false;
      }

      if (!configRow.started && configRow.ready && speed > configRow.start + 1) {
        configRow.started = true;
        configRow.records = [];
        configRow.records.push(record);
        configRow.previousRecords = this.records.slice(
          this.records.length - 5,
          this.records.length
        );
      } else if (configRow.started && speed > configRow.end) {
        configRow.started = false;
        configRow.records.push(record);
        this.onNewResult(
          this.parseResult(configRow)
        );
      } else if (configRow.started && speed > configRow.start && speed < configRow.end) {
        configRow.records.push(record);
      }
    }

    this.records.push(record);
  }

  parseResult (configRow) {
    const records = [...configRow.previousRecords, ...configRow.records];
    const speedTime = {};

    for (let i = configRow.start; i <= configRow.end; i += 10) {
      speedTime[i] = this.findSpeed(i, records);
      console.log('> interpolateResult', i, speedTime[i]);
      console.log('---');
    }

    configRow.measureTime = ((speedTime[configRow.end] - speedTime[configRow.start]) / 100).toFixed(2);

    return configRow;
  }

  findSpeed (speed, records) {
    let interpolateResult = 0;

    for (const index in records) {
      const previousRecord = records[parseInt(index) - 1];
      const actualRecord = records[index];

      if (!previousRecord) {
        continue;
      }

      if (actualRecord.speed > speed && previousRecord.speed <= speed) {
        console.log('> foundSpeed: ', previousRecord.speed, ' - ', actualRecord.speed);
        interpolateResult = actualRecord.time -
          ((actualRecord.time - previousRecord.time) *
            (actualRecord.speed - speed) /
            (actualRecord.speed - previousRecord.speed));
      }
    }

    return interpolateResult;
  }
}
