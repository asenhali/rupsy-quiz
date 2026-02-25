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

const SwipeContext = createContext<SwipeContextValue | null>(null);

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
  if (!ctx) {
    throw new Error("useSwipeContext must be used within SwipeProvider");
  }
  return ctx;
}
