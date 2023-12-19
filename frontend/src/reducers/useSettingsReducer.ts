import { useLocalStorage } from "react-use";
import { useCallback, useReducer } from "react";

interface ReducerState {
  speed: { start: number; end: number }[];
  testMode: boolean;
  weight: number;
  speedOn3000rpm: number;
  cx: number;
  frontalSurface: number;
  wheelLoss: number;
  powerFac: number;
  airDensity: number;
}

type Save = { type: "save"; payload: ReducerState };
type Reset = { type: "reset" };
type ReducerActions = Save | Reset;

const LOCAL_STORAGE_KEY: string = "SETTINGS";
const INITIAL_STATE: ReducerState = {
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
};

function reducer(state: ReducerState, action: ReducerActions): ReducerState {
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
  savedState: ReducerState | undefined,
  initialState: ReducerState
) => {
  if (!savedState) {
    return initialState;
  }

  return { ...INITIAL_STATE, ...savedState };
};

export const useSettingReducer = () => {
  const [savedState, saveState] = useLocalStorage(
    LOCAL_STORAGE_KEY,
    INITIAL_STATE
  );

  const reducerLocalStorage = useCallback(
    (state: ReducerState, action: ReducerActions) => {
      const newState = reducer(state, action);

      saveState(newState);

      return newState;
    },
    [saveState]
  );

  return useReducer(
    reducerLocalStorage,
    fillInitialValues(savedState, INITIAL_STATE)
  );
};
