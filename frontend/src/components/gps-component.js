import { onStartButtonClick, onStopButtonClick } from '../utils/bluetooth.js';
import { downloadFile } from '../utils/utils.js';
import { parseGpsData } from '../utils/gps.js';
import { Measure } from '../classes/measure.js';

export function GpsComponent (element) {
  const $connectButton = element.querySelector('button.connect');
  const $disconnectButton = element.querySelector('button.disconnect');
  const $csvButton = element.querySelector('button.csv');
  const $data = element.querySelector('.data');
  const $log = element.querySelector('.log');
  const $testSpeed = element.querySelector('.test-speed');
  const $testSpeedValue = element.querySelector('.test-speed-value');
  const $measureResult = element.querySelector('.measure-result');
  const $realTime = element.querySelector('.real-time');
  const $modalBg = element.querySelector('.modal-bg');
  const $modal = $modalBg.querySelector('.modal');
  let csv = [];
  const measure = new Measure(
    (result) => {
      const $row = document.createElement('div');

      $row.innerHTML = `<div class="measure-row">
          <span class="measure-speed">
            ${result.start} - ${result.end}
          </span>
          <span class="measure-time">
            ${result.measureTime.toFixed(2)}s
            <a href="#" class="download-data">[D]</a>
          </span>
        </div>`;

      $row
        .querySelector('a.download-data')
        .addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          downloadFile(
            JSON.stringify(result, null, 2),
            `race-gps-${result.start}-${result.end}-${Date.now()}.json`,
            'text/plain'
          );
          console.log(result);
        });

      $row.addEventListener('click', () => {
        $modalBg.style.visibility = 'visible';
        $modal.innerHTML = `<h2>${result.start} - ${result.end}: ${result.measureTime.toFixed(2)}s</h2>`;

        let resultTimes = '';
        const speedList = Object.keys(result.speedTime);

        for (const index in speedList) {
          const start = speedList[0];
          const end = speedList[parseInt(index) + 1];

          if (start >= 0 && end >= 0) {
            const time = result.speedTime[end] - result.speedTime[start];
            resultTimes += `<li>${start} - ${end}: ${time.toFixed(2)}s </li>`;
          }
        }

        $modal.innerHTML += resultTimes;
      });

      $measureResult.prepend($row);
    }
  );
  measure.addConfig(0, 60);
  measure.addConfig(0, 100);
  measure.addConfig(100, 150);
  measure.addConfig(100, 200);

  const onData = (event) => {
    const { time, satellites, alt, speed } = parseGpsData(event.target.value);

    measure.addRecord(speed, time);
    csv.push([time, satellites, alt, speed]);
    $csvButton.innerText = `CSV (${csv.length})`;

    $data.innerHTML = [
      'Satellites:', satellites, '<br>',
      'Speed:', speed.toFixed(4), '<br>',
      'Alt:', alt, '<br>',
      String(time).match(/.{1,2}/g).join(' ')
    ].join(' ');
    $realTime.innerText = new Date().toLocaleTimeString() + ' ' + new Date().getMilliseconds();
  };

  const log = (data) => {
    $log.innerText = data;
  };

  $connectButton.addEventListener('click', () => {
    csv = [];
    onStartButtonClick(onData, log);
  });

  $disconnectButton.addEventListener('click', () => {
    onStopButtonClick(onData, log);
  });

  $csvButton.addEventListener('click', () => {
    downloadFile(
      'time,satellites,alt,speed\n' + csv.map(line => line.join(',')).join('\n'),
      `race-gps-raw-data-${Date.now()}.csv`
    );
  });

  $modalBg.addEventListener('click', () => {
    $modalBg.style.visibility = 'hidden';
  });

  $testSpeed.addEventListener('input', (event) => {
    const speed = event.target.value;
    const time = Date.now() / 10;

    $testSpeedValue.innerText = speed;
    measure.addRecord(speed, time);
  });
}
