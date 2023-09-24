var myCharacteristic;

function log(data) {
  console.log('GPS', data)
}

function onStartButtonClick(callback) {
  let serviceUuid = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
  if (serviceUuid.startsWith('0x')) {
    serviceUuid = parseInt(serviceUuid);
  }

  let characteristicUuid = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
  if (characteristicUuid.startsWith('0x')) {
    characteristicUuid = parseInt(characteristicUuid);
  }

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

    $data.innerHTML = [
      'Satellites:', value.getUint8(3), '<br>',
      'Speed:', value.getUint8(2), '<br>',
      String(time).match(/.{1,2}/g).join(' ')
    ].join(' ')
  }

  $connect.addEventListener('click', () => onStartButtonClick(onData))
  $disconnect.addEventListener('click', () => onStopButtonClick(onData))
}
