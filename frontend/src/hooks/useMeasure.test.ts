import { afterEach, describe, expect, test, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useMeasure } from "./useMeasure.ts";

describe("useMeasure", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("addRecord", async () => {
    let measureTimeResult = 0;

    const { result, unmount } = renderHook(() =>
      useMeasure({
        speedConfig: [[10, 50]],
        onResult: (data) => {
          measureTimeResult = data.measureTime;
        },
      }),
    );

    act(() => {
      result.current.addRecord(0, 200);
      result.current.addRecord(10, 210);
      result.current.addRecord(30, 220);
      result.current.addRecord(40, 230);
      result.current.addRecord(50, 240);
      result.current.addRecord(60, 250);
      result.current.addRecord(70, 260);
    });

    expect(result.current.speed).toBe(70);
    expect(result.current.time).toBe(260);
    expect(measureTimeResult).toBe(0.3);

    unmount();
  });
});
