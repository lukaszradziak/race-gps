import { describe, expect, test } from "vitest";
import { parseGpsData } from "./gps.ts";

describe("parseGpsData", () => {
  test("test empty data", () => {
    expect(parseGpsData(undefined)).toStrictEqual({
      time: "",
      speed: 0,
      alt: 0,
      satellites: 0,
    });
  });

  test("test valid data", () => {
    const buffer = new ArrayBuffer(10);
    const view = new Uint8Array(buffer);

    // alt
    view[0] = 25;
    view[1] = 5;
    // speed
    view[2] = 60;
    view[3] = 10;
    // satellites
    view[4] = 10;
    // time
    view[5] = 1;
    view[6] = 34;
    view[7] = 80;
    view[8] = 20;

    expect(parseGpsData(new DataView(buffer))).toStrictEqual({
      time: "19025940",
      speed: 284.6524,
      alt: 6405,
      satellites: 10,
    });
  });
});
