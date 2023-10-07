export interface GpsData {
  time: number;
  speed: number;
  alt: number;
  satellites: number;
}

export function parseGpsData(value: DataView | undefined): GpsData {
  if (!value) {
    return {
      time: 0,
      speed: 0,
      alt: 0,
      satellites: 0,
    };
  }

  return {
    time: [
      value.getUint8(5) * Math.pow(256, 3),
      value.getUint8(6) * Math.pow(256, 2),
      value.getUint8(7) * Math.pow(256, 1),
      value.getUint8(8) * Math.pow(256, 0),
    ].reduce((a, b) => a + b, 0),
    speed:
      ([
        value.getUint8(2) * Math.pow(256, 1),
        value.getUint8(3) * Math.pow(256, 0),
      ].reduce((a, b) => a + b, 0) /
        100) *
      1.852,
    alt: [
      value.getUint8(0) * Math.pow(256, 1),
      value.getUint8(1) * Math.pow(256, 0),
    ].reduce((a, b) => a + b, 0),
    satellites: value.getUint8(4),
  };
}
