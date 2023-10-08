import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { GpsComponent } from "./GpsComponent.tsx";

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
    render(<GpsComponent />);
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

  test("click-disconnect", () => {
    const disconnectButton = screen.getByText("Disconnect");
    fireEvent.click(disconnectButton);

    expect(disconnectMock.mock.calls.length).toBe(1);
  });

  // TODO: rest of test cases
});
