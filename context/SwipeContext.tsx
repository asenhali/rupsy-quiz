"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type SwipeContextValue = {
  swipeDisabled: boolean;
  setSwipeDisabled: (v: boolean) => void;
};

const defaultValue: SwipeContextValue = {
  swipeDisabled: false,
  setSwipeDisabled: () => {},
};

const SwipeContext = createContext<SwipeContextValue>(defaultValue);

export function SwipeProvider({ children }: { children: ReactNode }) {
  const [swipeDisabled, setSwipeDisabled] = useState(false);
  return (
    <SwipeContext.Provider value={{ swipeDisabled, setSwipeDisabled }}>
      {children}
    </SwipeContext.Provider>
  );
}

export function useSwipeContext() {
  const ctx = useContext(SwipeContext);
  return ctx ?? defaultValue;
}
