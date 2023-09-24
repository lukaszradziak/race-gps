var myCharacteristic;

function log(data) {
  console.log('GPS', data)
}

function onStartButtonClick(callback) {
  let serviceUuid = '65316b7c-b605-45b4-be6d-b02473b0d29a';
  let characteristicUuid = 'c8ad396d-8006-488d-beed-3a55c4b5ccae';

  log('Requesting Bluetooth Device...');
  navigator.bluetooth.requestDevice({filters: [{services: [serviceUuid]}]})
  .then(device => {
    log('Connecting to GATT Server...');
    return device.gatt.connect();
  })
  .then(server => {
    log('Getting Service...');
    return server.getPrimaryService(serviceUuid);
  })
  .then(service => {
    log('Getting Characteristic...');
    return service.getCharacteristic(characteristicUuid);
  })
  .then(characteristic => {
    myCharacteristic = characteristic;
    return myCharacteristic.startNotifications().then(_ => {
      log('> Notifications started');
      myCharacteristic.addEventListener('characteristicvaluechanged', callback);
    });
  })
  .catch(error => {
    log('Argh! ' + error);
  });
}

function onStopButtonClick(callback) {
  if (myCharacteristic) {
    myCharacteristic.stopNotifications()
    .then(_ => {
      log('> Notifications stopped');
      myCharacteristic.removeEventListener('characteristicvaluechanged', callback);
    })
    .catch(error => {
      log('Argh! ' + error);
    });
  }
}

export function setupGps(element) {
  const $connect = element.querySelector('button.connect')
  const $disconnect = element.querySelector('button.disconnect')
  const $data = element.querySelector('.data')

  const onData = (event) => {
    const value = event.target.value
    const time = [
      value.getUint8(4) * Math.pow(256, 3),
      value.getUint8(5) * Math.pow(256, 2),
      value.getUint8(6) * Math.pow(256, 1),
      value.getUint8(7) * Math.pow(256, 0),
    ].reduce((a, b) => a + b, 0)
    const speed = parseFloat(value.getUint8(2)*1.852).toFixed(2)

    $data.innerHTML = [
      'Satellites:', value.getUint8(3), '<br>',
      'Speed:', speed, '<br>',
      String(time).match(/.{1,2}/g).join(' ')
    ].join(' ')
  }

  $connect.addEventListener('click', () => onStartButtonClick(onData))
  $disconnect.addEventListener('click', () => onStopButtonClick(onData))
}
