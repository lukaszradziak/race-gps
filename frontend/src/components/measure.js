export class Measure {
  config = [];
  records = [];
  results = [];
  onNewResult = () => {};

  constructor (onNewResult = () => {}) {
    this.onNewResult = onNewResult;
  }

  addConfig (start, end) {
    this.config.push({
      start,
      end,
      started: false,
      records: []
    });
  }

  addRecord (speed, time) {
    const record = { speed, time };
    this.records.push(record);

    for (const configRow of this.config) {
      if (!configRow.started && speed > configRow.start + 1 && speed < configRow.end + 1) {
        console.log(`started ${configRow.start}-${configRow.end}`);
        configRow.started = true;
        configRow.records.push(record);
      } else if (configRow.started && speed > configRow.end + 1) {
        console.log(`ended ${configRow.start}-${configRow.end}`);
        configRow.started = false;
        this.onNewResult(`ended ${configRow.start}-${configRow.end}`);
      }
    }
  }
}
