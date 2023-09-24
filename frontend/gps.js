var myCharacteristic;
var bluetoothDevice;

function onStartButtonClick(callback, log) {
  let serviceUuid = '65316b7c-b605-45b4-be6d-b02473b0d29a';
  let characteristicUuid = 'c8ad396d-8006-488d-beed-3a55c4b5ccae';

  bluetoothDevice = null;
  log('Requesting Bluetooth Device...');

  if (!navigator.bluetooth) {
    log('Browser not supporting bluetooth');
    return;
  }

  navigator.bluetooth.requestDevice({filters: [{services: [serviceUuid]}]})
  .then(device => {
    bluetoothDevice = device;
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

function onStopButtonClick(callback, log) {
  if (myCharacteristic) {
    myCharacteristic.stopNotifications()
    .then(_ => {
      log('> Notifications stopped');
      myCharacteristic.removeEventListener('characteristicvaluechanged', callback);

      if (!bluetoothDevice) {
        return;
      }
      log('Disconnecting from Bluetooth Device...');
      if (bluetoothDevice.gatt.connected) {
        bluetoothDevice.gatt.disconnect();
        log('Disconnected');
      } else {
        log('> Bluetooth Device is already disconnected');
      }
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
  const $log = element.querySelector('.log')

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

  const log = (data) => {
    $log.innerText = data;
  }

  $connect.addEventListener('click', () => onStartButtonClick(onData, log))
  $disconnect.addEventListener('click', () => onStopButtonClick(onData, log))
}
