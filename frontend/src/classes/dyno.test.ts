import { describe, expect, test } from "vitest";
import { Dyno } from "./dyno.ts";

describe("dyno", () => {
  test("test1", () => {
    const sampleData = [
      [20, 0],
      [21, 10],
      [22, 20],
      [21, 40],
      [20, 50], // start power
      [23, 60],
      [29, 70],
      [35, 80],
      [41, 90],
      [50, 100],
      [63, 110],
      [78, 120],
      [90, 130],
      [110, 140],
      [135, 150],
      [150, 160],
      [151, 170], // end power
      [151, 180], // start loss
      [150, 190],
      [149, 200],
      [148, 210],
      [147, 220],
      [146, 230],
      [145, 240],
      [146, 250], // end loss
      [144, 260],
    ];

    const dyno = new Dyno(5);

    for (const data of sampleData) {
      dyno.addRecord(data[0], data[1]);
    }

    expect(dyno.getPowerRecords().length).toBe(14);
    expect(dyno.getLossRecords().length).toBe(6);
  });
});
