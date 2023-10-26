import { describe, expect, test } from "vitest";
import { parseToTime } from "./number.ts";

describe("number", () => {
  test("parseToTime1", () => {
    expect(parseToTime("15511020") - parseToTime("15511000")).toBe(20);
    expect(parseToTime("15511020") - parseToTime("15505960")).toBe(1060);
  });

  test("parseToTime2", () => {
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
