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
      records: []
    });
  }

  addRecord (speed, time) {
    const record = { speed, time };
    this.records.push(record);

    for (const configRow of this.config) {
      if (speed <= configRow.start) {
        configRow.ready = true;
      }

      if (speed > configRow.end) {
        configRow.ready = false;
      }

      if (!configRow.started && configRow.ready && speed > configRow.start) {
        configRow.started = true;
        configRow.records = [];
        configRow.records.push(record);
      } else if (configRow.started && speed > configRow.end) {
        configRow.started = false;
        configRow.records.push(record);
        this.onNewResult(configRow);
      }
    }
  }
}
