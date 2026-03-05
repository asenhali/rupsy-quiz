"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type OnboardingContextValue = {
  isOnboarding: boolean;
  setIsOnboarding: (v: boolean) => void;
  showWelcomePopup: boolean;
  setShowWelcomePopup: (v: boolean) => void;
};

const defaultValue: OnboardingContextValue = {
  isOnboarding: false,
  setIsOnboarding: () => {},
  showWelcomePopup: false,
  setShowWelcomePopup: () => {},
};

const OnboardingContext = createContext<OnboardingContextValue>(defaultValue);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  return (
    <OnboardingContext.Provider
      value={{ isOnboarding, setIsOnboarding, showWelcomePopup, setShowWelcomePopup }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  return ctx ?? defaultValue;
}
