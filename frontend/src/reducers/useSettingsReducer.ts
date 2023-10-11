import { useLocalStorage } from "react-use";
import { useCallback, useReducer } from "react";

interface ReducerState {
  speed: { start: number; end: number }[];
  testMode: boolean;
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

export const useSettingReducer = () => {
  const [savedState, saveState] = useLocalStorage(
    LOCAL_STORAGE_KEY,
    INITIAL_STATE,
  );

  const reducerLocalStorage = useCallback(
    (state: ReducerState, action: ReducerActions) => {
      const newState = reducer(state, action);

      saveState(newState);

      return newState;
    },
    [saveState],
  );

  return useReducer(reducerLocalStorage, savedState || INITIAL_STATE);
};
