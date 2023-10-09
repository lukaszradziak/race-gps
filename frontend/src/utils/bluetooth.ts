// TODO: all to refactor
let myCharacteristic: BluetoothRemoteGATTCharacteristic | undefined;
let bluetoothDevice: BluetoothDevice | undefined;

export function onStartButtonClick(
  callback: (event: Event) => void,
  log: (data: string) => void,
) {
  const serviceUuid = "65316b7c-b605-45b4-be6d-b02473b0d29a";
  const characteristicUuid = "c8ad396d-8006-488d-beed-3a55c4b5ccae";

  bluetoothDevice = undefined;
  log("Requesting Bluetooth Device...");

  if (!navigator.bluetooth) {
    log("Browser not supporting bluetooth");
    return;
  }

  navigator.bluetooth
    .requestDevice({ filters: [{ services: [serviceUuid] }] })
    .then((device) => {
      bluetoothDevice = device;
      log("Connecting to GATT Server...");
      return device.gatt?.connect();
    })
    .then((server) => {
      log("Getting Service...");
      return server?.getPrimaryService(serviceUuid);
    })
    .then((service) => {
      log("Getting Characteristic...");
      return service?.getCharacteristic(characteristicUuid);
    })
    .then((characteristic) => {
      myCharacteristic = characteristic;
      return myCharacteristic?.startNotifications().then(() => {
        log("Notifications started");
        myCharacteristic?.addEventListener(
          "characteristicvaluechanged",
          callback,
        );
      });
    })
    .catch((error) => {
      log("Argh! " + error);
    });
}

export function onStopButtonClick(
  callback: (event: Event) => void,
  log: (data: string) => void,
) {
  if (myCharacteristic) {
    myCharacteristic
      .stopNotifications()
      .then(() => {
        log("Notifications stopped");
        myCharacteristic?.removeEventListener(
          "characteristicvaluechanged",
          callback,
        );

        if (!bluetoothDevice) {
          return;
        }
        log("Disconnecting from Bluetooth Device...");
        if (bluetoothDevice?.gatt?.connected) {
          bluetoothDevice?.gatt.disconnect();
          log("Disconnected");
        } else {
          log("> Bluetooth Device is already disconnected");
        }
      })
      .catch((error: string) => {
        log("Argh! " + error);
      });
  }
}
