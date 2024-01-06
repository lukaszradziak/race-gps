import { useLocalStorage } from "react-use";
import { useCallback, useReducer } from "react";

export interface SettingsReducerState {
  speed: { start: number; end: number }[];
  testMode: boolean;
  weight: number;
  speedOn3000rpm: number;
  cx: number;
  frontalSurface: number;
  wheelLoss: number;
  powerFac: number;
  airDensity: number;
  apiEnabled: boolean;
  apiAutomatic: boolean;
  apiUrl: string;
}

type Save = { type: "save"; payload: SettingsReducerState };
type Reset = { type: "reset" };
type ReducerActions = Save | Reset;

const LOCAL_STORAGE_KEY: string = "SETTINGS";
const INITIAL_STATE: SettingsReducerState = {
  speed: [
    { start: 0, end: 60 },
    { start: 0, end: 100 },
    { start: 100, end: 150 },
    { start: 100, end: 200 },
  ],
  testMode: false,
  weight: 1560,
  speedOn3000rpm: 68,
  cx: 0.28,
  frontalSurface: 2.15,
  wheelLoss: 0.0015,
  powerFac: 1.1,
  airDensity: 1.2,
  apiEnabled: false,
  apiAutomatic: false,
  apiUrl: "",
};

function reducer(
  state: SettingsReducerState,
  action: ReducerActions,
): SettingsReducerState {
  switch (action.type) {
    case "save":
      return action.payload;
    case "reset":
      return INITIAL_STATE;
    default:
      return state;
  }
}

const fillInitialValues = (
  savedState: SettingsReducerState | undefined,
  initialState: SettingsReducerState,
) => {
  if (!savedState) {
    return initialState;
  }

  return { ...INITIAL_STATE, ...savedState };
};

export const useSettingReducer = () => {
  const [savedState, saveState] = useLocalStorage(
    LOCAL_STORAGE_KEY,
    INITIAL_STATE,
  );

  const reducerLocalStorage = useCallback(
    (state: SettingsReducerState, action: ReducerActions) => {
      const newState = reducer(state, action);

      saveState(newState);

      return newState;
    },
    [saveState],
  );

  return useReducer(
    reducerLocalStorage,
    fillInitialValues(savedState, INITIAL_STATE),
  );
};
