import { onStartButtonClick, onStopButtonClick } from '../utils/bluetooth.js';
import { downloadCSV } from '../utils/utils.js';
import { parseGpsData } from '../utils/gps.js';
import { Measure } from '../classes/measure.js';

export function GpsComponent (element) {
  const $connect = element.querySelector('button.connect');
  const $disconnect = element.querySelector('button.disconnect');
  const $csv = element.querySelector('button.csv');
  const $data = element.querySelector('.data');
  const $log = element.querySelector('.log');
  const $testSpeed = element.querySelector('.test-speed');
  const $testSpeedValue = element.querySelector('.test-speed-value');
  const $measureResult = element.querySelector('.measure-result');
  let csv = [];

  const onData = (event) => {
    const { time, satellites, alt, speed } = parseGpsData(event.target.value);

    csv.push([time, satellites, alt, speed]);
    $csv.innerText = `CSV (${csv.length})`;

    $data.innerHTML = [
      'Satellites:', satellites, '<br>',
      'Speed:', speed, '<br>',
      'Alt:', alt, '<br>',
      String(time).match(/.{1,2}/g).join(' ')
    ].join(' ');
  };

  const log = (data) => {
    $log.innerText = data;
  };

  $connect.addEventListener('click', () => {
    csv = [];
    onStartButtonClick(onData, log);
  });

  $disconnect.addEventListener('click', () => {
    onStopButtonClick(onData, log);
  });

  $csv.addEventListener('click', () => {
    downloadCSV(
      'time,satellites,alt,speed\n' + csv.map(line => line.join(',')).join('\n'),
      `race-gps-${Date.now()}.csv`
    );
  });

  const measure = new Measure(
    (result) => {
      $measureResult.innerHTML = `
        <div class="measure-row">
          <span class="measure-speed">
            ${result.start} - ${result.end}
          </span>
          <span class="measure-time">${result.measureTime.toFixed(2)}s</span>
        </div>
      ` + $measureResult.innerHTML;
      console.log(result);
    }
  );
  measure.addConfig(0, 60);
  measure.addConfig(0, 100);
  measure.addConfig(100, 150);
  measure.addConfig(100, 200);

  $testSpeed.addEventListener('input', (event) => {
    const speed = event.target.value;
    const time = Date.now();

    $testSpeedValue.innerText = speed;
    measure.addRecord(speed, time);
  });
}
