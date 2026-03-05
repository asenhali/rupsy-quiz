"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type WelcomeModalContextValue = {
  showWelcomeModal: boolean;
  setShowWelcomeModal: (v: boolean) => void;
};

const defaultValue: WelcomeModalContextValue = {
  showWelcomeModal: false,
  setShowWelcomeModal: () => {},
};

const WelcomeModalContext = createContext<WelcomeModalContextValue>(defaultValue);

export function WelcomeModalProvider({ children }: { children: ReactNode }) {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  return (
    <WelcomeModalContext.Provider value={{ showWelcomeModal, setShowWelcomeModal }}>
      {children}
    </WelcomeModalContext.Provider>
  );
}

export function useWelcomeModal() {
  const ctx = useContext(WelcomeModalContext);
  return ctx ?? defaultValue;
}
