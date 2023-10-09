import { onStartButtonClick, onStopButtonClick } from "../utils/bluetooth.ts";
import { useEffect, useState } from "react";

export interface useBluetoothType {
  connect: () => void;
  disconnect: () => void;
  log: string;
}

export interface useBluetoothParam {
  handleData: (event: Event) => void;
}

export function useBluetooth({
  handleData,
}: useBluetoothParam): useBluetoothType {
  const [log, setLog] = useState("");

  const handleLog = (data: string) => {
    setLog(data);
  };

  useEffect(() => {
    return () => {
      onStopButtonClick(handleData, handleLog);
    };
    // eslint-disable-next-line
  }, []);

  return {
    connect: () => {
      onStartButtonClick(handleData, handleLog);
    },
    disconnect: () => {
      onStopButtonClick(handleData, handleLog);
    },
    log,
  };
}
