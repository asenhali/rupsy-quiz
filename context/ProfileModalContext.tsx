"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type ProfileUser = {
  nickname?: string;
  rupsyId?: string;
  city?: string;
  level?: number;
  totalXP?: number;
  totalPoints?: number;
  rCoins?: number;
  totalGames?: number;
  totalCorrect?: number;
  avatarId?: string;
};

type ProfileModalContextValue = {
  isOpen: boolean;
  openProfile: () => void;
  closeProfile: () => void;
  user: ProfileUser | null;
  setUser: (u: ProfileUser | null | ((prev: ProfileUser | null) => ProfileUser | null)) => void;
  showQuiz: boolean;
  setShowQuiz: (v: boolean) => void;
};

const defaultValue: ProfileModalContextValue = {
  isOpen: false,
  openProfile: () => {},
  closeProfile: () => {},
  user: null,
  setUser: () => {},
  showQuiz: false,
  setShowQuiz: () => {},
};

const ProfileModalContext = createContext<ProfileModalContextValue>(defaultValue);

export function ProfileModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  const value: ProfileModalContextValue = {
    isOpen,
    openProfile: () => setIsOpen(true),
    closeProfile: () => setIsOpen(false),
    user,
    setUser,
    showQuiz,
    setShowQuiz,
  };

  return (
    <ProfileModalContext.Provider value={value}>
      {children}
    </ProfileModalContext.Provider>
  );
}

export function useProfileModal() {
  const ctx = useContext(ProfileModalContext);
  return ctx ?? defaultValue;
}
