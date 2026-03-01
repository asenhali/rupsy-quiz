"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type XPRewardData = {
  xpBreakdown: { participationXP: number; correctXP: number; rankXP: number; totalXP: number };
  levelBefore: number;
  levelAfter: number;
  newTotalXP: number;
  rank: number;
};

type XPRewardContextValue = {
  xpRewardData: XPRewardData | null;
  showXPReward: (data: XPRewardData) => void;
  closeXPReward: () => void;
  isOpen: boolean;
};

const defaultValue: XPRewardContextValue = {
  xpRewardData: null,
  showXPReward: () => {},
  closeXPReward: () => {},
  isOpen: false,
};

const XPRewardContext = createContext<XPRewardContextValue>(defaultValue);

export function XPRewardProvider({ children }: { children: ReactNode }) {
  const [xpRewardData, setXpRewardData] = useState<XPRewardData | null>(null);

  const showXPReward = useCallback((data: XPRewardData) => {
    setXpRewardData(data);
  }, []);

  const closeXPReward = useCallback(() => {
    setXpRewardData(null);
  }, []);

  return (
    <XPRewardContext.Provider
      value={{
        xpRewardData,
        showXPReward,
        closeXPReward,
        isOpen: xpRewardData != null,
      }}
    >
      {children}
    </XPRewardContext.Provider>
  );
}

export function useXPReward() {
  const ctx = useContext(XPRewardContext);
  return ctx ?? defaultValue;
}
