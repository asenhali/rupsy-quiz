"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [user, setUser] = useState<{
    nickname?: string;
    avatarId?: string;
    city?: string;
    level?: number;
    totalXP?: number;
  } | null>(null);

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
      setLoading(false);
    }
    initAuth();
  }, [router]);

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#f3e6c0] text-[#1b2833]">
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-[90px] h-[90px] rounded-full bg-[#1b2833]/10 shrink-0" />
          <p className="text-sm opacity-60 mt-4">Načítavanie...</p>
        </div>
      )}

      {!loading && needsOnboarding === true && (
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
              className="p-2 border border-[#1b2833]/20 rounded-xl bg-white/50"
            />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="city"
              className="p-2 border border-[#1b2833]/20 rounded-xl bg-white/50"
            />
            <button type="submit" className="p-2 bg-[#1b2833] text-[#f3e6c0] rounded-2xl font-semibold shadow-[0_2px_8px_rgba(27,40,51,0.15)]">
              Začať hrať
            </button>
          </form>
        </div>
      )}

      {!loading && needsOnboarding === false && (
        <>
        <div className="flex-1 flex flex-col w-full max-w-[480px] mx-auto pt-10">
          {/* A) Header Section */}
          <section className="flex-shrink-0 flex flex-row items-center gap-4 py-2 px-4">
            <img
              src={avatarMap[user?.avatarId ?? ""] || avatarMap.default}
              alt="avatar"
              className="w-[90px] h-[90px] rounded-full object-cover flex-shrink-0 shadow-[0_2px_8px_rgba(27,40,51,0.1)]"
            />
            <div className="flex-1 flex flex-col justify-center min-w-0">
              <p className="font-bold text-lg tracking-tight">{user?.nickname ?? ""}</p>
              <p className="text-xs font-normal opacity-60">Level {user?.level ?? 1}</p>
              <div className="w-full h-2 bg-[#1b2833]/15 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-[#1b2833] rounded-full"
                  style={{ width: `${(user?.totalXP ?? 0) % 100}%` }}
                />
              </div>
            </div>
          </section>

          {/* B) Last Week Rank Section */}
          <section className="flex-shrink-0 flex flex-col py-3 px-4 pb-8">
            <p className="text-sm mb-3 tracking-wide opacity-90">Minulý týždeň si sa umiestnil:</p>
            <div className="flex flex-row items-end gap-2 w-full">
              <div className="flex-1 flex flex-col items-center bg-[#1b2833]/5 rounded-3xl py-2 px-2 mt-4 shadow-[0_1px_3px_rgba(27,40,51,0.06)]">
                <p className="text-xs opacity-70 mb-1">
                  {(user?.city ?? "Tvoje mesto").toUpperCase()}
                </p>
                <p className="font-extrabold text-lg">#8</p>
              </div>
              <div className="flex-[1.2] flex flex-col items-center bg-[#1b2833]/8 rounded-3xl py-4 px-3 shadow-[0_2px_8px_rgba(27,40,51,0.1)]">
                <p className="text-xs opacity-70 mb-1">SLOVENSKO</p>
                <p className="font-extrabold text-2xl">#8</p>
              </div>
              <div className="flex-1 flex flex-col items-center bg-[#1b2833]/5 rounded-3xl py-2 px-2 mt-4 shadow-[0_1px_3px_rgba(27,40,51,0.06)]">
                <p className="text-xs opacity-70 mb-1">TVOJE MESTO</p>
                <p className="font-extrabold text-lg">#8</p>
              </div>
            </div>
          </section>

          {/* C) Countdown Section */}
          <section className="flex-shrink-0 py-6 px-4 text-center">
            <p className="text-sm opacity-80">Placeholder countdown</p>
          </section>

          {/* D) Action Section */}
          <section className="flex-shrink-0 flex flex-col gap-2 mt-24 pt-4 pb-6 px-4">
            <button
              type="button"
              onClick={() => console.log("PLAY")}
              className="w-full py-4 bg-[#1b2833] text-[#f3e6c0] rounded-2xl font-semibold shadow-[0_2px_12px_rgba(27,40,51,0.2)]"
            >
              HRÁŤ KVÍZ
            </button>
            <button
              type="button"
              onClick={() => console.log("LEADERBOARD")}
              className="w-full py-2 bg-[#1b2833]/5 text-[#1b2833] rounded-xl font-medium border-0"
            >
              LEADERBOARD
            </button>
            <button
              type="button"
              onClick={() => router.push("/friends")}
              className="w-full py-2 bg-[#1b2833]/5 text-[#1b2833] rounded-xl font-medium border-0"
            >
              PRIATELIA
            </button>
          </section>
        </div>

        <button
          type="button"
          onClick={() => console.log("SETTINGS")}
          className="fixed left-4 bottom-6 w-11 h-11 rounded-full bg-[#1b2833]/8 text-[#1b2833] flex items-center justify-center shadow-[0_1px_4px_rgba(27,40,51,0.08)] z-10"
          aria-label="Nastavenia"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-1.73a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h1.73a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1.73a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
        </>
      )}
    </div>
  );
}
