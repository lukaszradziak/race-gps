import { describe, expect, test } from "vitest";
import { Dyno } from "./dyno.ts";

describe("dyno", () => {
  test("test1", () => {
    const sampleData = [
      [20, 12010100],
      [21, 12010101],
      [22, 12010102],
      [21, 12010104],
      [20, 12010105], // start power
      [23, 12010106],
      [29, 12010107],
      [35, 12010108],
      [41, 12010109],
      [50, 12010110],
      [63, 12010111],
      [78, 12010112],
      [90, 12010113],
      [110, 12010114],
      [135, 12010115],
      [150, 12010116],
      [151, 12010117], // end power
      [151, 12010118], // start loss
      [150, 12010119],
      [149, 12010120],
      [148, 12010121],
      [147, 12010122],
      [146, 12010123],
      [145, 12010124],
      [146, 12010125], // end loss
      [144, 12010126],
    ];

    const dyno = new Dyno(5);

    for (const data of sampleData) {
      dyno.addRecord(data[0], String(data[1]));
    }

    dyno.calculatePowerRecords();
    expect(dyno.getPowerRecords().length).toBe(14);
    expect(dyno.getLossRecords().length).toBe(6);
  });
});
