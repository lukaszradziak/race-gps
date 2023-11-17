import { describe, expect, test } from "vitest";
import { actualTime, averageValues, parseToTime } from "./number.ts";

describe("actualTime", () => {
  test("test length of time string", () => {
    expect(actualTime().length).toBe(8);
  });
});

describe("averageValues", () => {
  test("test average result", () => {
    expect(
      averageValues(
        [
          0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85,
          90, 95, 100,
        ],
        13,
        8,
      ),
    ).toBe(58.8235294117647);
  });
});

describe("parseToTime", () => {
  test("test length validation", () => {
    expect(() => parseToTime("123456789")).toThrowError('Wrong value of time: "123456789"');
  });

  test("test time difference", () => {
    expect(parseToTime("15511020") - parseToTime("15511000")).toBe(20);
    expect(parseToTime("15511020") - parseToTime("15505960")).toBe(1060);
  });

  test("test change day", () => {
    const sampleData: string[] = [
      "23592000",
      "23593000",
      "23594000",
      "23595000",
      "00000200",
    ];

    const values = [];

    for (const keyValue in sampleData) {
      const value = sampleData[keyValue];
      const previousValue = sampleData[parseInt(keyValue) - 1];

      values.push(parseToTime(value, previousValue));
    }

    expect(values[1] - values[0]).toBe(1000);
    expect(values[2] - values[1]).toBe(1000);
    expect(values[3] - values[2]).toBe(1000);
    expect(values[4] - values[3]).toBe(1200);
  });
});
