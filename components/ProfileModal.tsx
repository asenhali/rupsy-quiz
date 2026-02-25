"use client";

import { useEffect, useState } from "react";
import { AVAILABLE_AVATARS } from "@/config/avatars";
import { useSwipeContext } from "@/context/SwipeContext";

type ProfileUser = {
  nickname?: string;
  rupsyId?: string;
  city?: string;
  level?: number;
  totalXP?: number;
  totalPoints?: number;
  totalGames?: number;
  totalCorrect?: number;
  avatarId?: string;
};

type ProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: ProfileUser | null;
  onAvatarChange: (newAvatarId: string) => void;
};

export default function ProfileModal({
  isOpen,
  onClose,
  user,
  onAvatarChange,
}: ProfileModalProps) {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const { setSwipeDisabled } = useSwipeContext();

  useEffect(() => {
    setSwipeDisabled(isOpen);
    return () => setSwipeDisabled(false);
  }, [isOpen, setSwipeDisabled]);

  if (!isOpen) return null;

  const avatarId = user?.avatarId ?? "default";
  const avatarSrc = `/avatars/${avatarId}.png`;

  return (
    <div className="fixed inset-0 z-[60] bg-[#f3e6c0] flex justify-center touch-none">
      <div className="w-full max-w-[480px] h-full flex flex-col overflow-y-auto">
      <div className="flex-shrink-0 pt-10 px-4 flex items-center gap-3 mb-2">
        <button
          type="button"
          onClick={onClose}
          className="p-2 -ml-2 bg-transparent text-sm font-medium opacity-50 text-[#1b2833] border-0"
        >
          ← Späť
        </button>
        <h1 className="text-xl font-bold">Profil</h1>
      </div>

      <div className="flex-shrink-0 py-6 flex flex-col items-center">
        <img
          src={avatarSrc}
          alt=""
          className="w-24 h-24 rounded-full object-cover border-2 border-[#1b2833]/10"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/avatars/default.png";
          }}
        />
        <button
          type="button"
          onClick={() => setShowAvatarPicker((v) => !v)}
          className="text-xs font-medium uppercase tracking-widest opacity-40 mt-3 bg-transparent border-0 underline text-[#1b2833] cursor-pointer"
        >
          Zmeniť avatar
        </button>
      </div>

      {showAvatarPicker && (
        <div className="grid grid-cols-4 gap-3 px-4 py-4">
          {AVAILABLE_AVATARS.map(({ id }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                onAvatarChange(id);
                setShowAvatarPicker(false);
              }}
              className="p-0 border-0 bg-transparent cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1b2833]"
            >
              <img
                src={`/avatars/${id}.png`}
                alt=""
                width={64}
                height={64}
                className={`w-16 h-16 rounded-full object-cover ${
                  avatarId === id ? "ring-2 ring-[#1b2833] ring-offset-2" : ""
                }`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/avatars/default.png";
                }}
              />
            </button>
          ))}
        </div>
      )}

      <div className="flex-shrink-0 px-4 py-4 flex flex-col items-center text-center">
        <p className="text-2xl font-bold tracking-tight">{user?.nickname ?? ""}</p>
        <p className="text-sm opacity-40 font-medium mt-1">{user?.rupsyId ?? ""}</p>
        <p className="text-sm opacity-40 mt-0.5">{user?.city ?? ""}</p>
      </div>

      <div className="flex-shrink-0 px-4 py-6">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-40 mb-4">UMIESTNENIA</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/40 border border-[#1b2833]/[0.06] p-3 flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-widest opacity-40 font-medium mb-1 text-center leading-tight">SLOVENSKO</span>
            <span className="text-xl font-bold">—</span>
          </div>
          <div className="rounded-2xl bg-white/40 border border-[#1b2833]/[0.06] p-3 flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-widest opacity-40 font-medium mb-1 text-center leading-tight">{(user?.city ?? "").toUpperCase() || "MESTO"}</span>
            <span className="text-xl font-bold">—</span>
          </div>
          <div className="rounded-2xl bg-white/40 border border-[#1b2833]/[0.06] p-3 flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-widest opacity-40 font-medium mb-1 text-center leading-tight">MESTÁ</span>
            <span className="text-xl font-bold">—</span>
          </div>
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest opacity-40 mb-4 mt-6">ŠTATISTIKY</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/40 border border-[#1b2833]/[0.06] p-4 flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-widest opacity-40 font-medium mb-1">LEVEL</span>
            <span className="text-2xl font-bold">{user?.level ?? 1}</span>
          </div>
          <div className="rounded-2xl bg-white/40 border border-[#1b2833]/[0.06] p-4 flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-widest opacity-40 font-medium mb-1">ODOHRANÝCH HIER</span>
            <span className="text-2xl font-bold">{user?.totalGames ?? 0}</span>
          </div>
          <div className="rounded-2xl bg-white/40 border border-[#1b2833]/[0.06] p-4 flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-widest opacity-40 font-medium mb-1">SPRÁVNYCH ODPOVEDÍ</span>
            <span className="text-2xl font-bold">{user?.totalCorrect ?? 0}</span>
          </div>
          <div className="rounded-2xl bg-white/40 border border-[#1b2833]/[0.06] p-4 flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-widest opacity-40 font-medium mb-1">CELKOVÉ XP</span>
            <span className="text-2xl font-bold">{user?.totalXP ?? 0}</span>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 px-4 py-6">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-40 mb-4">ODZNAKY</p>
        <p className="text-sm opacity-30">Už čoskoro</p>
      </div>

      <div className="flex-shrink-0 pb-20" />
      </div>
    </div>
  );
}
