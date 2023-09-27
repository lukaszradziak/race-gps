import {onStartButtonClick, onStopButtonClick} from "../utils/bluetooth.js";
import {downloadCSV} from "../utils/utils.js";

export function GpsComponent(element) {
  const $connect = element.querySelector('button.connect')
  const $disconnect = element.querySelector('button.disconnect')
  const $csv = element.querySelector('button.csv')
  const $data = element.querySelector('.data')
  const $log = element.querySelector('.log')
  let csv = [];

  const onData = (event) => {
    const value = event.target.value
    const time = [
      value.getUint8(5) * Math.pow(256, 3),
      value.getUint8(6) * Math.pow(256, 2),
      value.getUint8(7) * Math.pow(256, 1),
      value.getUint8(8) * Math.pow(256, 0),
    ].reduce((a, b) => a + b, 0)
    const speed = ([
      value.getUint8(2) * Math.pow(256, 1),
      value.getUint8(3) * Math.pow(256, 0),
    ].reduce((a, b) => a + b, 0) / 100 * 1.852).toFixed(4)
    const alt = [
      value.getUint8(0) * Math.pow(256, 1),
      value.getUint8(1) * Math.pow(256, 0),
    ].reduce((a, b) => a + b, 0)
    const satellites = value.getUint8(4)

    csv.push([time, satellites, alt, speed])
    $csv.innerText = `CSV (${csv.length})`

    $data.innerHTML = [
      'Satellites:', satellites, '<br>',
      'Speed:', speed, '<br>',
      'Alt:', alt, '<br>',
      String(time).match(/.{1,2}/g).join(' ')
    ].join(' ')
  }

  const log = (data) => {
    $log.innerText = data;
  }

  $connect.addEventListener('click', () => {
    csv = []
    onStartButtonClick(onData, log)
  })

  $disconnect.addEventListener('click', () => {
    onStopButtonClick(onData, log)
  })

  $csv.addEventListener('click', () => {
    downloadCSV(
      'time,satellites,alt,speed\n' + csv.map(line => line.join(',')).join('\n'),
      `race-gps-${Date.now()}.csv`
    )
  })
}
