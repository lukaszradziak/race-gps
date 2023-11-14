import { afterEach, describe, expect, test, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useBluetooth } from "./useBluetooth.ts";

describe("useBluetooth", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  vi.mock("../utils/bluetooth.ts", () => {
    // noinspection JSUnusedGlobalSymbols
    return {
      onStartButtonClick: (
        handleData: (event: Event) => void,
        handleLog: (data: string) => void,
      ) => {
        handleData(new Event("Start sample-data"));
        handleLog("Start log");
      },
      onStopButtonClick: (
        handleData: (event: Event) => void,
        handleLog: (data: string) => void,
      ) => {
        handleData(new Event("Stop sample-data"));
        handleLog("Stop log");
      },
    };
  });

  test("connect-and-disconnect", async () => {
    let handleDataResult = "";

    const { result } = renderHook(() =>
      useBluetooth({
        handleData: (event) => {
          handleDataResult = event.type;
        },
      }),
    );

    act(() => {
      result.current.connect();
    });

    expect(result.current.log).toBe("Start log");
    expect(handleDataResult).toEqual("Start sample-data");

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.log).toBe("Stop log");
    expect(handleDataResult).toEqual("Stop sample-data");
  });
});
