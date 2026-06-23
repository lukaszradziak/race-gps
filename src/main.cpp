#include <Arduino.h>
#include <NimBLEDevice.h>
#include <WiFi.h>

// ─── UUIDs ────────────────────────────────────────────────────────────────────
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define TELEMETRY_CHAR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define COMMAND_CHAR_UUID   "beb5483f-36e1-4688-b7f5-ea07361b26a8"

// ─── GPS UART (M10050, pins 16=RX 17=TX) ─────────────────────────────────────
#define GPS_RX 16
#define GPS_TX 17

// ─── Debug logging ────────────────────────────────────────────────────────────
// Enabled only in env:debug (-D GPS_DEBUG). In production Serial is never
// initialized so UART0 stays idle and there is zero scheduling overhead.
#ifdef GPS_DEBUG
  #define GPS_LOG(...)   Serial.printf(__VA_ARGS__)
  #define GPS_LOGLN(...) Serial.println(__VA_ARGS__)
#else
  #define GPS_LOG(...)   ((void)0)
  #define GPS_LOGLN(...) ((void)0)
#endif

// ─── BLE frame (little-endian, packed — JS DataView must use littleEndian=true)
// Offsets: timestamp_ms@0(4), seq@4(2), speed_mmps@6(4), altitude_mm@10(4),
//          hacc_dm@14(2), sats@16(1), fix@17(1)  — 18 bytes total
struct __attribute__((packed)) TelemetryFrame {
    uint32_t timestamp_ms;  // millis()
    uint16_t seq;           // monotonic counter — detect drops client-side
    int32_t  speed_mmps;    // NAV-PVT gSpeed (I4, mm/s, always ≥0 physically)
    int32_t  altitude_mm;   // NAV-PVT hMSL (I4, mm above MSL)
    uint16_t hacc_dm;       // NAV-PVT hAcc/100, capped (dm = 0.1 m units)
    uint8_t  sats;          // NAV-PVT numSV
    uint8_t  fix;           // NAV-PVT fixType: 0=no fix, 2=2D, 3=3D, 4=GNSS+DR
};

struct __attribute__((packed)) CommandFrame {
    uint8_t cmd;
    uint8_t payload[19];
};

enum Command : uint8_t {
    CMD_PING         = 0x01,
    CMD_ASSIST_TIME  = 0x02,  // payload: year(2LE), month, day, hour, min, sec, leapSecs — 8 B
    CMD_ASSIST_POS   = 0x03,  // payload: lat_e7(4LE), lon_e7(4LE), alt_cm(4LE), acc_cm(4LE) — 16 B
};

// ─── GPS state ────────────────────────────────────────────────────────────────
static int32_t  g_speed_mmps  = 0;
static int32_t  g_altitude_mm = 0;
static uint32_t g_hacc_mm     = 999999;
static uint8_t  g_sats        = 0;
static uint8_t  g_fix         = 0;

// ─── UBX send helper ─────────────────────────────────────────────────────────
// Builds and flushes one UBX frame: B5 62 [cls] [id] [len16LE] [payload] [ck_a ck_b]
static void ubxSend(HardwareSerial& serial, uint8_t cls, uint8_t id,
                    const uint8_t* payload, size_t len) {
    uint8_t ck_a = 0, ck_b = 0;
    auto feed = [&](uint8_t b) { ck_a += b; ck_b += ck_a; };
    uint8_t lo = len & 0xFF, hi = (len >> 8) & 0xFF;
    feed(cls); feed(id); feed(lo); feed(hi);
    for (size_t i = 0; i < len; i++) feed(payload[i]);

    serial.write(0xB5); serial.write(0x62);
    serial.write(cls);  serial.write(id);
    serial.write(lo);   serial.write(hi);
    serial.write(payload, len);
    serial.write(ck_a); serial.write(ck_b);
    serial.flush();
}

// ─── GPS init ────────────────────────────────────────────────────────────────
// Sends UBX-CFG-VALSET (RAM layer) commands to configure the M10050:
//   • CFG-UART1-BAUDRATE  0x40520001  U4  → 115200
//   • CFG-UART1OUTPROT-NMEA  0x10740002  L   → false  (kills NMEA flood at 25Hz)
//   • CFG-UART1OUTPROT-UBX   0x10740001  L   → true
//   • CFG-RATE-MEAS          0x30210001  U2  → 40 ms  (25 Hz)
//   • CFG-MSGOUT-UBX_NAV_PVT_UART1  0x20910006  U1  → 1
static void gpsInit() {
    // Switch baud at both 9600 (factory default) and 38400 (common pre-config).
    // Whichever one matches the module's current baud will succeed; the other
    // sends garbled bytes the module ignores.
    const uint8_t setBaud[] = {
        0x00, 0x01, 0x00, 0x00,          // version=0, layers=RAM, reserved×2
        0x01, 0x00, 0x52, 0x40,          // key 0x40520001 (CFG-UART1-BAUDRATE)
        0x00, 0xC2, 0x01, 0x00,          // value 115200 = 0x0001C200
    };
    const uint32_t initBauds[] = {9600, 38400};
    for (int i = 0; i < 2; i++) {
        Serial2.begin(initBauds[i], SERIAL_8N1, GPS_RX, GPS_TX);
        delay(50);
        ubxSend(Serial2, 0x06, 0x8A, setBaud, sizeof(setBaud));
        delay(100);
        Serial2.end();
    }

    Serial2.begin(115200, SERIAL_8N1, GPS_RX, GPS_TX);
    delay(100);

    // Disable NMEA, enable UBX on UART1 output
    const uint8_t disNmea[] = {
        0x00, 0x01, 0x00, 0x00,
        0x02, 0x00, 0x74, 0x10,          // key 0x10740002 (CFG-UART1OUTPROT-NMEA)
        0x00,                            // false
    };
    ubxSend(Serial2, 0x06, 0x8A, disNmea, sizeof(disNmea));
    delay(50);

    const uint8_t enUbx[] = {
        0x00, 0x01, 0x00, 0x00,
        0x01, 0x00, 0x74, 0x10,          // key 0x10740001 (CFG-UART1OUTPROT-UBX)
        0x01,                            // true
    };
    ubxSend(Serial2, 0x06, 0x8A, enUbx, sizeof(enUbx));
    delay(50);

    // 25 Hz measurement rate + enable UBX-NAV-PVT on UART1
    const uint8_t cfgRate[] = {
        0x00, 0x01, 0x00, 0x00,
        0x01, 0x00, 0x21, 0x30,          // key 0x30210001 (CFG-RATE-MEAS)
        0x28, 0x00,                      // value 40 ms
        0x06, 0x00, 0x91, 0x20,          // key 0x20910006 (CFG-MSGOUT-UBX_NAV_PVT_UART1)
        0x01,                            // value 1 = every nav solution
    };
    ubxSend(Serial2, 0x06, 0x8A, cfgRate, sizeof(cfgRate));
    delay(100);

    GPS_LOGLN("GPS: M10050 configured — 115200 baud, 25 Hz, UBX-NAV-PVT");
}

// ─── UBX-NAV-PVT parser ──────────────────────────────────────────────────────
// State machine — reads Serial2 and updates g_* globals on each valid PVT frame.
// NMEA lines and unknown UBX messages are transparently discarded.
//
// NAV-PVT payload offsets used:
//   [20] fixType  [23] numSV  [36..39] hMSL(mm)  [40..43] hAcc(mm)  [60..63] gSpeed(mm/s)
static void processUBX() {
    enum State : uint8_t { SYNC1, SYNC2, CLS, MSG_ID, LEN_LO, LEN_HI, PAYLOAD, CK_A, CK_B };
    static State    state = SYNC1;
    static uint8_t  cls, id;
    static uint16_t len, idx;
    static uint8_t  buf[96];   // NAV-PVT payload = 92 bytes; 96 gives headroom
    static uint8_t  ck_a, ck_b;

    while (Serial2.available()) {
        const uint8_t b = (uint8_t)Serial2.read();
        switch (state) {
            case SYNC1:
                if (b == 0xB5) state = SYNC2;
                break;
            case SYNC2:
                if      (b == 0x62) { state = CLS; ck_a = ck_b = 0; }
                else if (b == 0xB5) { /* 0xB5 0xB5 — restart SYNC2 */ }
                else                  state = SYNC1;
                break;
            case CLS:
                cls = b; ck_a += b; ck_b += ck_a; state = MSG_ID; break;
            case MSG_ID:
                id = b;  ck_a += b; ck_b += ck_a; state = LEN_LO; break;
            case LEN_LO:
                len = b; ck_a += b; ck_b += ck_a; state = LEN_HI; break;
            case LEN_HI:
                len |= (uint16_t)b << 8; ck_a += b; ck_b += ck_a;
                idx = 0;
                state = (len > 0) ? PAYLOAD : CK_A;
                break;
            case PAYLOAD:
                if (idx < sizeof(buf)) buf[idx] = b;
                ck_a += b; ck_b += ck_a;
                if (++idx >= len) state = CK_A;
                break;
            case CK_A:
                state = (b == ck_a) ? CK_B : SYNC1;
                break;
            case CK_B:
                if (b == ck_b) {
                    // UBX-NAV-PVT (class=0x01, id=0x07)
                    if (cls == 0x01 && id == 0x07 && len >= 64) {
                        g_fix  = buf[20];
                        g_sats = buf[23];
                        memcpy(&g_altitude_mm, buf + 36, 4);
                        uint32_t hAcc; memcpy(&hAcc, buf + 40, 4);
                        memcpy(&g_speed_mmps,  buf + 60, 4);
                        g_hacc_mm = hAcc;
#ifdef GPS_DEBUG
                        static uint32_t pvtCount = 0;
                        if (++pvtCount % 25 == 1) {  // log once per second
                            GPS_LOG("PVT #%-5lu fix=%d sats=%2d  spd=%6.1f km/h"
                                    "  alt=%7.1f m  hAcc=%5.1f m\n",
                                pvtCount, g_fix, g_sats,
                                g_speed_mmps * 3.6f / 1000.0f,
                                g_altitude_mm / 1000.0f,
                                g_hacc_mm / 1000.0f);
                        }
#endif
                    }
#ifdef GPS_DEBUG
                    // UBX-ACK-ACK (class=0x05, id=0x01) — config command accepted
                    else if (cls == 0x05 && id == 0x01 && len >= 2) {
                        GPS_LOG("UBX ACK  for class=0x%02X id=0x%02X\n", buf[0], buf[1]);
                    }
                    // UBX-ACK-NAK (class=0x05, id=0x00) — config command rejected
                    else if (cls == 0x05 && id == 0x00 && len >= 2) {
                        GPS_LOG("UBX NAK! for class=0x%02X id=0x%02X  (wrong key?)\n",
                                buf[0], buf[1]);
                    }
#endif
                }
#ifdef GPS_DEBUG
                else {
                    GPS_LOG("UBX checksum FAIL  cls=0x%02X id=0x%02X len=%d\n", cls, id, len);
                }
#endif
                state = SYNC1;
                break;
        }
    }
}

// ─── BLE globals ─────────────────────────────────────────────────────────────
static NimBLECharacteristic* pTelemetryChar = nullptr;
static NimBLECharacteristic* pCommandChar   = nullptr;
static bool clientConnected = false;

class ServerCallbacks : public NimBLEServerCallbacks {
    void onConnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo) override {
        clientConnected = true;
        pServer->updateConnParams(connInfo.getConnHandle(), 16, 32, 0, 500);
        GPS_LOG("BLE connected  handle=%d\n", connInfo.getConnHandle());
    }
    void onDisconnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo, int reason) override {
        clientConnected = false;
        GPS_LOG("BLE disconnected  reason=%d\n", reason);
        NimBLEDevice::startAdvertising();
    }
};

class CommandCallbacks : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo&) override {
        const NimBLEAttValue val = pChar->getValue();
        if (val.size() == 0) return;
        const CommandFrame* frame = reinterpret_cast<const CommandFrame*>(val.data());
        switch (frame->cmd) {
            case CMD_PING:
                GPS_LOGLN("CMD: PING");
                break;

            case CMD_ASSIST_TIME: {
                // UBX-MGA-INI-TIME_UTC (class 0x13, id 0x40, type 0x10)
                // Injects current UTC so the module skips satellite time sync.
                if (val.size() < 9) break;
                const uint8_t* p = frame->payload;
                uint16_t year; memcpy(&year, p, 2);
                const uint8_t mga[24] = {
                    0x10,                              // type = UTC
                    0x00,                              // version
                    0x00,                              // ref = none
                    p[7],                              // leapSecs (GPS-UTC offset, currently 18)
                    (uint8_t)(year & 0xFF), (uint8_t)(year >> 8),
                    p[2], p[3], p[4], p[5], p[6],     // month, day, hour, min, sec
                    0x00,                              // reserved
                    0x00, 0x00, 0x00, 0x00,            // ns = 0
                    0x01, 0x00,                        // tAccS = 1 s (NTP-synced browser)
                    0x00, 0x00,                        // reserved
                    0x00, 0x00, 0x00, 0x00,            // tAccNs = 0
                };
                ubxSend(Serial2, 0x13, 0x40, mga, sizeof(mga));
                GPS_LOG("ASSIST: time %04d-%02d-%02d %02d:%02d:%02d leapSecs=%d\n",
                        year, p[2], p[3], p[4], p[5], p[6], p[7]);
                break;
            }

            case CMD_ASSIST_POS: {
                // UBX-MGA-INI-POS_LLH (class 0x13, id 0x40, type 0x01)
                // Injects approximate position so the module skips sky search.
                if (val.size() < 17) break;
                const uint8_t* p = frame->payload;
                int32_t lat_e7, lon_e7, alt_cm; uint32_t acc_cm;
                memcpy(&lat_e7, p,    4);
                memcpy(&lon_e7, p+4,  4);
                memcpy(&alt_cm, p+8,  4);
                memcpy(&acc_cm, p+12, 4);
                uint8_t mga[20] = {};
                mga[0] = 0x01;  // type = LLH
                memcpy(mga+4,  &lat_e7, 4);
                memcpy(mga+8,  &lon_e7, 4);
                memcpy(mga+12, &alt_cm, 4);
                memcpy(mga+16, &acc_cm, 4);
                ubxSend(Serial2, 0x13, 0x40, mga, sizeof(mga));
                GPS_LOG("ASSIST: pos lat=%.5f lon=%.5f alt=%dm acc=%lum\n",
                        lat_e7 / 1e7, lon_e7 / 1e7, alt_cm / 100, (unsigned long)(acc_cm / 100));

                // UBX-CFG-RST: GNSS-only controlled software reset (resetMode=0x02).
                // Triggers re-acquisition using the freshly injected MGA data.
                // navBbrMask=0x0000 = hot start (keeps almanac/ephemeris cache).
                delay(50);
                const uint8_t rst[] = { 0x00, 0x00, 0x02, 0x00 };
                ubxSend(Serial2, 0x06, 0x04, rst, sizeof(rst));
                GPS_LOGLN("ASSIST: GNSS hot start triggered");
                break;
            }

            default:
                GPS_LOG("CMD: unknown 0x%02X\n", frame->cmd);
                break;
        }
    }
};

// ─── Setup ───────────────────────────────────────────────────────────────────
void setup() {
#ifdef GPS_DEBUG
    Serial.begin(115200);
    Serial.println("Race GPS v2 — starting [DEBUG]");
#endif
    WiFi.mode(WIFI_OFF);

    gpsInit();

    NimBLEDevice::init("RaceGPSv2");
    NimBLEDevice::setPower(9);
    NimBLEDevice::setMTU(247);

    NimBLEServer* pServer = NimBLEDevice::createServer();
    pServer->setCallbacks(new ServerCallbacks());

    NimBLEService* pService = pServer->createService(SERVICE_UUID);

    pTelemetryChar = pService->createCharacteristic(TELEMETRY_CHAR_UUID, NIMBLE_PROPERTY::NOTIFY);
    pCommandChar   = pService->createCharacteristic(COMMAND_CHAR_UUID,   NIMBLE_PROPERTY::WRITE_NR);
    pCommandChar->setCallbacks(new CommandCallbacks());

    pService->start();

    NimBLEAdvertising* pAdv = NimBLEDevice::getAdvertising();
    pAdv->addServiceUUID(SERVICE_UUID);
    pAdv->start();

    GPS_LOGLN("BLE advertising");
}

// ─── Loop ────────────────────────────────────────────────────────────────────
static uint32_t lastTelemetry = 0;
static uint16_t seq = 0;

void loop() {
    processUBX();

    const uint32_t now = millis();
    if (clientConnected && (now - lastTelemetry >= 40)) {
        lastTelemetry = now;

        TelemetryFrame frame;
        frame.timestamp_ms = now;
        frame.seq          = seq++;
        frame.speed_mmps   = g_speed_mmps;
        frame.altitude_mm  = g_altitude_mm;
        frame.hacc_dm      = (uint16_t)min(g_hacc_mm / 100, (uint32_t)65535);
        frame.sats         = g_sats;
        frame.fix          = g_fix;

        pTelemetryChar->setValue(reinterpret_cast<uint8_t*>(&frame), sizeof(frame));
        pTelemetryChar->notify();
    }
}