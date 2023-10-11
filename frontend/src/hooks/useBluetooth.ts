import { onStartButtonClick, onStopButtonClick } from "../utils/bluetooth.ts";
import { useEffect, useState } from "react";

export interface useBluetoothType {
  connect: () => void;
  disconnect: () => void;
  log: string;
  connected: boolean;
}

export interface useBluetoothParam {
  handleData: (event: Event) => void;
}

export function useBluetooth({
  handleData,
}: useBluetoothParam): useBluetoothType {
  const [log, setLog] = useState("");
  const [connected, setConnected] = useState(false);

  const handleLog = (data: string) => {
    setLog(data);
  };

  useEffect(() => {
    return () => {
      onStopButtonClick(handleData, handleLog);
      setConnected(false);
    };
    // eslint-disable-next-line
  }, []);

  return {
    connect: () => {
      onStartButtonClick(handleData, handleLog, () => {
        setConnected(true);
      });
    },
    disconnect: () => {
      onStopButtonClick(handleData, handleLog);
      setConnected(false);
    },
    log,
    connected,
  };
}
