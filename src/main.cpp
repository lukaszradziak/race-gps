#include <Arduino.h>
#include <TinyGPSPlus.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <SoftwareSerial.h>

#define SERVICE_UUID "65316b7c-b605-45b4-be6d-b02473b0d29a"
#define CHARACTERISTIC_UUID "c8ad396d-8006-488d-beed-3a55c4b5ccae"

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;

TinyGPSPlus gps;
SoftwareSerial ss(25, 26);
byte data[8];
int lastTime = 0;
const float kalmanGain = 0.5;
uint32_t startTime;
int32_t speed;

class MyServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
  };

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
  }
};

void setup() {
  Serial.begin(115200);
  Serial.println("Hello in Race GPS");
  Serial.println();

  ss.begin(38400);

  BLEDevice::init("ESP32");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  BLEService *pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ   |
    BLECharacteristic::PROPERTY_WRITE  |
    BLECharacteristic::PROPERTY_NOTIFY |
    BLECharacteristic::PROPERTY_INDICATE
  );
  pCharacteristic->addDescriptor(new BLE2902());
  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x0);
  BLEDevice::startAdvertising();
}

void loop() {
  if (deviceConnected) {

    while (ss.available() > 0) {
      if (gps.encode(ss.read())) {
        // int time = gps.time.value();
        uint32_t time = millis() - startTime;
        int satellites = gps.satellites.value();
        speed = kalmanGain * gps.speed.value() + (1 - kalmanGain) * speed;

        int alt = gps.altitude.meters();

        data[0] = (alt >> 8) & 0xff;
        data[1] = alt & 0xff;
        data[2] = (speed >> 8) & 0xff;
        data[3] = speed & 0xff;
        data[4] = satellites & 0xff;
        data[5] = (time >> 24) & 0xff;
        data[6] = (time >> 16) & 0xff;
        data[7] = (time >> 8) & 0xff;
        data[8] = time & 0xff;

        if (lastTime != time) {
          pCharacteristic->setValue(data, 9);
          pCharacteristic->notify();
          lastTime = time;
        }
      }
    }

    delay(10);
  }

  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
    Serial.println("start advertising");
    oldDeviceConnected = deviceConnected;
    startTime = millis();
    speed = 0;
  }

  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }
}