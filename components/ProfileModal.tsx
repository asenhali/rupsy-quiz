"use client";

import { useEffect, useState } from "react";
import { AVAILABLE_AVATARS } from "@/config/avatars";
import { useProfileModal } from "@/context/ProfileModalContext";
import { useSwipeContext } from "@/context/SwipeContext";

type BestRanking = {
  bestCityRank: number | null;
  bestSlovakiaRank: number | null;
  bestCitiesRank: number | null;
} | null;

export default function ProfileModal() {
  const { isOpen, closeProfile, user, setUser } = useProfileModal();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [bestRanking, setBestRanking] = useState<BestRanking>(null);
  const { setSwipeDisabled } = useSwipeContext();

  useEffect(() => {
    setSwipeDisabled(isOpen);
    return () => setSwipeDisabled(false);
  }, [isOpen, setSwipeDisabled]);

  useEffect(() => {
    if (!isOpen) return;
    setBestRanking(null);
    fetch("/api/quiz/best-ranking", { credentials: "include" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setBestRanking({
            bestCityRank: json.bestCityRank ?? null,
            bestSlovakiaRank: json.bestSlovakiaRank ?? null,
            bestCitiesRank: json.bestCitiesRank ?? null,
          });
        }
      });
  }, [isOpen]);

  async function handleAvatarChange(newAvatarId: string) {
    const res = await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ avatarId: newAvatarId }),
    });
    const json = await res.json();
    if (json.success) {
      setUser((prev) => (prev ? { ...prev, avatarId: newAvatarId } : null));
    }
    setShowAvatarPicker(false);
  }

  if (!isOpen) return null;

  const avatarId = user?.avatarId ?? "default";
  const avatarSrc = `/avatars/${avatarId}.png`;

  return (
    <div className="fixed top-0 left-0 w-screen h-screen z-[100] bg-[#f3e6c0] overflow-y-auto touch-auto">
      <div className="w-full max-w-[480px] mx-auto px-4 pt-10 pb-20">
        <div className="flex items-center gap-3 mb-2">
          <button
            type="button"
            onClick={closeProfile}
            className="p-2 -ml-2 bg-transparent text-sm font-medium opacity-50 text-[#1b2833] border-0"
          >
            ← Späť
          </button>
          <h1 className="text-xl font-bold">Profil</h1>
        </div>

        <div className="py-6 flex flex-col items-center">
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
          <div className="grid grid-cols-4 gap-3 py-4">
            {AVAILABLE_AVATARS.map(({ id }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleAvatarChange(id)}
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

        <div className="py-4 flex flex-col items-center text-center">
          <p className="text-2xl font-bold tracking-tight">{user?.nickname ?? ""}</p>
          <p className="text-sm opacity-40 font-medium mt-1">{user?.rupsyId ?? ""}</p>
          <p className="text-sm opacity-40 mt-0.5">{user?.city ?? ""}</p>
        </div>

        <div className="py-6">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-40 mb-4">NAJLEPŠIE UMIESTNENIA</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/40 border border-[#1b2833]/[0.06] p-3 flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest opacity-40 font-medium mb-1 text-center leading-tight">{(user?.city ?? "").toUpperCase() || "MESTO"}</span>
              <span className="text-xl font-bold">
                {bestRanking?.bestCityRank != null ? `#${bestRanking.bestCityRank}` : "—"}
              </span>
            </div>
            <div className="rounded-2xl bg-white/60 border border-[#1b2833]/[0.08] p-4 flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest opacity-40 font-medium mb-1 text-center leading-tight">SLOVENSKO</span>
              <span className="text-2xl font-bold">
                {bestRanking?.bestSlovakiaRank != null ? `#${bestRanking.bestSlovakiaRank}` : "—"}
              </span>
            </div>
            <div className="rounded-2xl bg-white/40 border border-[#1b2833]/[0.06] p-3 flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest opacity-40 font-medium mb-1 text-center leading-tight">MESTÁ</span>
              <span className="text-xl font-bold">
                {bestRanking?.bestCitiesRank != null ? `#${bestRanking.bestCitiesRank}` : "—"}
              </span>
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
          <p className="text-xs font-semibold uppercase tracking-widest opacity-40 mb-4 mt-6">ODZNAKY</p>
          <p className="text-sm opacity-30">Už čoskoro</p>
        </div>
      </div>
    </div>
  );
}
