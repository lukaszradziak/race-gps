import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Measure } from "./Measure.tsx";

const connectMock = vi.fn();
const disconnectMock = vi.fn();

vi.mock("../hooks/useBluetooth.ts", () => ({
  useBluetooth: () => {
    return {
      connect: () => connectMock(),
      disconnect: () => disconnectMock(),
    };
  },
}));

describe("GpsComponent", () => {
  beforeEach(() => {
    render(<Measure />);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  test("render", () => {
    expect(connectMock.mock.calls.length).toBe(0);
    expect(disconnectMock.mock.calls.length).toBe(0);
  });

  test("click-connect", () => {
    const connectButton = screen.getByText("Connect");
    fireEvent.click(connectButton);

    expect(connectMock.mock.calls.length).toBe(1);
  });

  // TODO: click disconnect

  // TODO: rest of test cases
});
