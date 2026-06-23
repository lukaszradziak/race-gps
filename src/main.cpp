#include <Arduino.h>
#include <NimBLEDevice.h>
#include <WiFi.h>

// ─── UUIDs ────────────────────────────────────────────────────────────────────
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define TELEMETRY_CHAR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"  // board → client
#define COMMAND_CHAR_UUID   "beb5483f-36e1-4688-b7f5-ea07361b26a8"  // client → board

// ─── Frame definitions ────────────────────────────────────────────────────────
// All fields little-endian (native ESP32 byte order).
// JavaScript DataView must use littleEndian=true.

struct __attribute__((packed)) TelemetryFrame {
    uint32_t timestamp_ms;  // millis()
    uint16_t seq;           // monotonic counter — detect dropped frames client-side
    // add GPS/IMU fields here as the project grows
};

struct __attribute__((packed)) CommandFrame {
    uint8_t cmd;
    uint8_t payload[19];  // up to 19 bytes of command-specific data
};

enum Command : uint8_t {
    CMD_PING = 0x01,
};

// ─── BLE globals ─────────────────────────────────────────────────────────────
static NimBLECharacteristic* pTelemetryChar = nullptr;
static NimBLECharacteristic* pCommandChar   = nullptr;
static bool clientConnected = false;

// ─── Server callbacks ─────────────────────────────────────────────────────────
class ServerCallbacks : public NimBLEServerCallbacks {
    void onConnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo) override {
        clientConnected = true;
        // Request connection interval 20–40ms, 0 latency, 5s supervision timeout.
        // Intervals in units of 1.25ms — central (phone/browser) may override.
        pServer->updateConnParams(connInfo.getConnHandle(), 16, 32, 0, 500);
        Serial.printf("BLE connected  handle=%d\n", connInfo.getConnHandle());
    }

    void onDisconnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo, int reason) override {
        clientConnected = false;
        Serial.printf("BLE disconnected  reason=%d\n", reason);
        NimBLEDevice::startAdvertising();
    }
};

// ─── Command callbacks ────────────────────────────────────────────────────────
class CommandCallbacks : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo&) override {
        const NimBLEAttValue val = pChar->getValue();
        if (val.size() == 0) return;

        const CommandFrame* frame = reinterpret_cast<const CommandFrame*>(val.data());
        switch (frame->cmd) {
            case CMD_PING:
                Serial.println("CMD: PING");
                break;
            default:
                Serial.printf("CMD: unknown 0x%02X\n", frame->cmd);
                break;
        }
    }
};

// ─── Setup ────────────────────────────────────────────────────────────────────
void setup() {
    Serial.begin(115200);
    Serial.println("Race GPS v2 — starting");

    // Free radio time otherwise consumed by WiFi coexistence logic.
    WiFi.mode(WIFI_OFF);

    NimBLEDevice::init("RaceGPSv2");
    NimBLEDevice::setPower(9);  // max TX power (ESP_PWR_LVL_P9)
    NimBLEDevice::setMTU(247);  // BLE 4.2 DLE — headroom for future larger frames

    NimBLEServer* pServer = NimBLEDevice::createServer();
    pServer->setCallbacks(new ServerCallbacks());

    NimBLEService* pService = pServer->createService(SERVICE_UUID);

    // Telemetry: board → client via notifications (no ACK, lowest latency)
    pTelemetryChar = pService->createCharacteristic(
        TELEMETRY_CHAR_UUID,
        NIMBLE_PROPERTY::NOTIFY
    );

    // Commands: client → board via write-without-response (no ACK, lowest latency)
    pCommandChar = pService->createCharacteristic(
        COMMAND_CHAR_UUID,
        NIMBLE_PROPERTY::WRITE_NR
    );
    pCommandChar->setCallbacks(new CommandCallbacks());

    NimBLEAdvertising* pAdv = NimBLEDevice::getAdvertising();
    pAdv->addServiceUUID(SERVICE_UUID);
    pAdv->start();

    Serial.println("BLE advertising");
}

// ─── Loop ─────────────────────────────────────────────────────────────────────
static uint32_t lastTelemetry = 0;
static uint16_t seq = 0;

void loop() {
    const uint32_t now = millis();

    if (clientConnected && (now - lastTelemetry >= 40)) {
        lastTelemetry = now;

        TelemetryFrame frame;
        frame.timestamp_ms = now;
        frame.seq = seq++;

        pTelemetryChar->setValue(reinterpret_cast<uint8_t*>(&frame), sizeof(frame));
        pTelemetryChar->notify();
    }
}
