"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfileModal } from "@/context/ProfileModalContext";

export default function HomePanel() {
  const router = useRouter();
  const { openProfile, user, setUser } = useProfileModal();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);

  const avatarMap: Record<string, string> = {
    default: "/avatars/default.png",
  };
  const [nickname, setNickname] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    async function initAuth() {
      const res = await fetch("/api/me", { credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        router.replace("/");
        return;
      }
      setNeedsOnboarding(json.needsOnboarding ?? null);
      setUser(json.user ?? null);
    }
    initAuth();
  }, [router, setUser]);

  return (
    <div className="h-full overflow-hidden flex flex-col bg-[#f3e6c0] text-[#1b2833]">
      {needsOnboarding === true && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await fetch("/api/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ nickname, city }),
              });
              const response = await res.json();
              if (response.success) {
                const meRes = await fetch("/api/me", {
                  credentials: "include",
                });
                const meJson = await meRes.json();
                setNeedsOnboarding(meJson.needsOnboarding ?? false);
                setUser(meJson.user ?? null);
              } else {
                console.error(response);
              }
            }}
            className="flex flex-col gap-4 w-full max-w-[320px]"
          >
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="nickname"
              className="p-3 border border-[#1b2833]/10 rounded-xl bg-white/40"
            />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="city"
              className="p-3 border border-[#1b2833]/10 rounded-xl bg-white/40"
            />
            <button type="submit" className="py-3 bg-[#1b2833] text-[#f3e6c0] rounded-2xl font-semibold">
              Začať hrať
            </button>
          </form>
        </div>
      )}

      {needsOnboarding !== true && (
        <div className="flex-1 flex flex-col w-full max-w-[480px] mx-auto pb-24 overflow-y-auto">
          <section className="flex items-center gap-3 px-5 pt-8 pb-4">
            <button
              type="button"
              onClick={openProfile}
              className="border-0 bg-transparent p-0 cursor-pointer flex-shrink-0"
            >
              <img
                src={avatarMap[user?.avatarId ?? ""] || avatarMap.default}
                alt="avatar"
                className="w-12 h-12 rounded-full object-cover border-2 border-[#1b2833]/10"
              />
            </button>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className="text-base font-semibold tracking-tight truncate">{user?.nickname ?? ""}</p>
              <p className="text-[10px] font-medium uppercase tracking-widest opacity-35">Level {user?.level ?? 1}</p>
            </div>
            <div className="flex items-center gap-1.5 bg-[#1b2833]/[0.06] rounded-full px-3 py-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider opacity-50">{user?.totalXP ?? 0} XP</span>
            </div>
          </section>

          <section className="mx-5 mt-2 rounded-3xl bg-[#1b2833] p-6 flex flex-col items-center text-[#f3e6c0]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-50 mb-3">TÝŽDENNÝ KVÍZ</p>
            <p className="text-sm font-medium opacity-60 mb-6">Štartuje čoskoro</p>
            <button
              type="button"
              onClick={() => console.log("PLAY")}
              className="w-full py-4 rounded-2xl bg-[#f3e6c0] text-[#1b2833] font-bold text-base tracking-wide text-center"
            >
              HRÁŤ KVÍZ
            </button>
            <p className="text-[10px] font-medium uppercase tracking-widest opacity-30 mt-3">SEZÓNA 1</p>
          </section>

          <section className="mx-5 mt-4 rounded-2xl bg-white/40 border border-[#1b2833]/[0.06] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-35 mb-3">POSLEDNÝ TÝŽDEŇ</p>
            <div className="flex justify-between">
              <div className="flex flex-col items-center flex-1">
                <span className="text-[9px] font-medium uppercase tracking-widest opacity-35 mb-1">{(user?.city ?? "MESTO").toUpperCase()}</span>
                <span className="text-lg font-bold">#—</span>
              </div>
              <div className="flex flex-col items-center flex-1 border-l border-[#1b2833]/[0.06] pl-2">
                <span className="text-[9px] font-medium uppercase tracking-widest opacity-35 mb-1">SLOVENSKO</span>
                <span className="text-xl font-bold">#—</span>
              </div>
              <div className="flex flex-col items-center flex-1 border-l border-[#1b2833]/[0.06] pl-2">
                <span className="text-[9px] font-medium uppercase tracking-widest opacity-35 mb-1">MESTÁ</span>
                <span className="text-lg font-bold">#—</span>
              </div>
            </div>
          </section>

          <button
            type="button"
            onClick={() => console.log("LEADERBOARD")}
            className="mx-5 mt-3 py-3 rounded-2xl bg-transparent text-center text-xs font-medium uppercase tracking-widest opacity-30"
          >
            REBRÍČEK
          </button>
        </div>
      )}
    </div>
  );
}
