#include <Arduino.h>
#include <TinyGPSPlus.h>

const char *gpsStream =
  "$GPRMC,045103.000,A,3014.1984,N,09749.2872,W,0.67,161.46,030913,,,A*7C\r\n"
  "$GPGGA,045104.123,3014.1985,N,09749.2873,W,1,09,1.2,211.6,M,-22.5,M,,0000*62\r\n"
  "$GPRMC,045200.000,A,3014.3820,N,09748.9514,W,36.88,65.02,030913,,,A*77\r\n"
  "$GPGGA,045201.000,3014.3864,N,09748.9411,W,1,10,1.2,200.8,M,-22.5,M,,0000*6C\r\n"
  "$GPRMC,045251.000,A,3014.4275,N,09749.0626,W,0.51,217.94,030913,,,A*7D\r\n"
  "$GPGGA,045252.000,3014.4273,N,09749.0628,W,1,09,1.3,1206.9,M,-22.5,M,,0000*5E\r\n";

TinyGPSPlus gps;
byte data[8];

void setup() {
  Serial.begin(115200);
  Serial.println("Hello in Race GPS");
  Serial.println();

  while (*gpsStream) {
    if (gps.encode(*gpsStream++)) {
      int time = gps.time.value();
      int satellites = gps.satellites.value();
      int speed = gps.speed.knots();
      int alt = gps.altitude.meters();

      data[0] = (alt >> 8) & 0xff;
      data[1] = alt & 0xff;
      data[2] = speed & 0xff;
      data[3] = satellites & 0xff;
      data[4] = (time >> 24) & 0xff;
      data[5] = (time >> 16) & 0xff;
      data[6] = (time >> 8) & 0xff;
      data[7] = time & 0xff;

      for (int i = 0; i < 8; i++) {
        Serial.print(data[i], HEX);
        Serial.print(" ");
      }

      Serial.println();
      delay(100);
    }
  }
}

void loop() {
  //
}