import { expect, test, describe } from "vitest";
import { Measure } from "./measure.ts";

describe("measure", () => {
  test("0-60", () => {
    const measure = new Measure();
    measure.addConfig(0, 60);

    measure.addRecord(0.1, "12000005");
    measure.addRecord(0.26, "12000010");
    measure.addRecord(0.35, "12000020");
    measure.addRecord(0.5, "12000030");
    measure.addRecord(1.5, "12000040");
    measure.addRecord(10, "12000050");
    measure.addRecord(59.5, "12000060");
    measure.addRecord(60.5, "12000070");

    expect(measure.getLastResult().speedTime.get(0)).toBe(0);
    expect(measure.getLastResult().speedTime.get(60)).toBe(30);
  });

  test("0-60_2", () => {
    const measure = new Measure();
    measure.addConfig(0, 60);

    measure.addRecord(0.1, "12000100");
    measure.addRecord(0.26, "12000110");
    measure.addRecord(0.35, "12000120");
    measure.addRecord(0.5, "12000130");
    measure.addRecord(1.5, "12000140");
    measure.addRecord(1.2, "12000150");
    measure.addRecord(0.8, "12000160");
    measure.addRecord(1.2, "12000170");
    measure.addRecord(10, "12000180");
    measure.addRecord(59.5, "12000190");
    measure.addRecord(60.5, "12000200");

    expect(measure.getLastResult().speedTime.get(0)).toBe(0);
    expect(measure.getLastResult().speedTime.get(60)).toBe(30);
  });

  test("100-150", () => {
    const measure = new Measure();
    measure.addConfig(100, 150);

    measure.addRecord(99, "12000140");
    measure.addRecord(101, "12000150");
    measure.addRecord(149, "12000160");
    measure.addRecord(151, "12000170");

    expect(measure.getLastResult().speedTime.get(100)).toBe(0);
    expect(measure.getLastResult().speedTime.get(150)).toBe(20);
  });

  test("100-150_2", () => {
    const measure = new Measure();
    measure.addConfig(100, 150);

    measure.addRecord(99.1, "12000100");
    measure.addRecord(100.9, "12000110");
    measure.addRecord(101, "12000120");
    measure.addRecord(149, "12000130");
    measure.addRecord(151, "12000140");

    expect(measure.getLastResult().speedTime.get(100)).toBe(0);
    expect(measure.getLastResult().speedTime.get(150)).toBe(30);
  });

  test("100-150_3", () => {
    const measure = new Measure();
    measure.addConfig(100, 150);

    measure.addRecord(99, "12000100");
    measure.addRecord(101, "12000110");
    measure.addRecord(99, "12000120");
    measure.addRecord(101, "12000130");
    measure.addRecord(100, "12000140");
    measure.addRecord(99, "12000150");
    measure.addRecord(100, "12000160");
    measure.addRecord(125, "12000170");
    measure.addRecord(150, "12000180");
    measure.addRecord(151, "12000190");

    expect(measure.getLastResult().speedTime.get(100)).toBe(0);
    expect(measure.getLastResult().speedTime.get(150)).toBe(20);
  });

  test("0-100-full", () => {
    const sampleData = [
      [15443410, 0.04],
      [15443420, 0.07],
      [15443430, 0.06],
      [15443440, 0.07],
      [15443450, 0.04],
      [15443460, 0.02],
      [15443470, 0.04],
      [15443480, 0.04],
      [15443490, 0.07],
      [15443500, 0.11],
      [15443510, 0.07],
      [15443520, 0.02],
      [15443530, 0.02],
      [15443540, 0.04],
      [15443550, 0.02],
      [15443560, 0.04],
      [15443570, 0.09],
      [15443580, 0.09],
      [15443590, 0.24],
      [15443600, 0.78],
      [15443610, 1.87],
      [15443620, 2.82],
      [15443630, 4.17],
      [15443640, 5.59],
      [15443650, 6.98],
      [15443660, 8.8],
      [15443670, 9.98],
      [15443680, 11.46],
      [15443690, 13.58],
      [15443700, 15.04],
      [15443710, 16.61],
      [15443720, 18.02],
      [15443730, 19.91],
      [15443740, 20.59],
      [15443750, 22.59],
      [15443760, 23.59],
      [15443770, 25.21],
      [15443780, 26.52],
      [15443790, 28.24],
      [15443800, 29.56],
      [15443810, 31.21],
      [15443820, 32.71],
      [15443830, 34.19],
      [15443840, 36.11],
      [15443850, 37.34],
      [15443860, 38.89],
      [15443870, 40.8],
      [15443880, 42.08],
      [15443890, 43.67],
      [15443900, 45.26],
      [15443910, 45.52],
      [15443920, 45.49],
      [15443930, 45.65],
      [15443940, 46.17],
      [15443950, 47.54],
      [15443960, 48.89],
      [15443970, 50.32],
      [15443980, 51.0],
      [15443990, 52.21],
      [15444000, 53.69],
      [15444010, 54.5],
      [15444020, 55.52],
      [15444030, 56.89],
      [15444040, 58.63],
      [15444050, 59.63],
      [15444060, 61.26],
      [15444070, 62.76],
      [15444080, 64.19],
      [15444090, 65.47],
      [15444100, 67.06],
      [15444110, 68.25],
      [15444120, 69.54],
      [15444130, 70.82],
      [15444140, 71.69],
      [15444150, 73.41],
      [15444160, 74.06],
      [15444170, 75.32],
      [15444180, 75.8],
      [15444190, 77.95],
      [15444200, 78.56],
      [15444210, 79.47],
      [15444220, 79.51],
      [15444230, 79.73],
      [15444240, 79.58],
      [15444250, 79.99],
      [15444260, 80.78],
      [15444270, 81.19],
      [15444280, 81.99],
      [15444290, 82.56],
      [15444300, 83.17],
      [15444310, 83.8],
      [15444320, 84.43],
      [15444330, 85.43],
      [15444340, 86.01],
      [15444350, 87.23],
      [15444360, 87.91],
      [15444370, 89.06],
      [15444380, 89.95],
      [15444390, 90.84],
      [15444400, 91.64],
      [15444410, 92.79],
      [15444420, 93.79],
      [15444430, 94.67],
      [15444440, 95.54],
      [15444450, 96.6],
      [15444460, 97.4],
      [15444470, 98.16],
      [15444480, 99.19],
      [15444490, 100.08],
      [15444500, 101.01],
      [15444510, 102.08],
      [15444520, 102.88],
      [15444530, 103.25],
      [15444540, 104.47],
    ];

    const measure = new Measure();
    measure.addConfig(0, 100);

    for (const row of sampleData) {
      measure.addRecord(row[1], String(row[0]));
    }

    expect(measure.getLastResult().measureTime.toFixed(4)).toBe("8.8708");
  });
});
