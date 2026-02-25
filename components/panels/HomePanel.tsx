"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePanel() {
  const router = useRouter();
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
    }
    initAuth();
  }, [router]);

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

      {needsOnboarding !== true && (
        <div className="flex-1 flex flex-col w-full max-w-[480px] mx-auto pt-10">
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

          <section className="flex-shrink-0 py-6 px-4 text-center">
            <p className="text-sm opacity-80">Placeholder countdown</p>
          </section>

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
          </section>
        </div>
      )}
    </div>
  );
}
