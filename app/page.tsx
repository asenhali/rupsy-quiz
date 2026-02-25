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
        <div className="flex-1 flex items-center justify-center p-6">
          <p>Loading...</p>
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
              className="p-2 border rounded"
            />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="city"
              className="p-2 border rounded"
            />
            <button type="submit" className="p-2 bg-[#1b2833] text-[#f3e6c0] rounded">
              Začať hrať
            </button>
          </form>
        </div>
      )}

      {!loading && needsOnboarding === false && (
        <div className="flex-1 flex flex-col w-full max-w-[480px] mx-auto">
          {/* A) Header Section */}
          <section className="flex-shrink-0 flex flex-row items-center gap-4 py-2 px-4">
            <img
              src={avatarMap[user?.avatarId ?? ""] || avatarMap.default}
              alt="avatar"
              className="w-[90px] h-[90px] rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 flex flex-col justify-center min-w-0">
              <p className="font-bold text-lg">{user?.nickname ?? ""}</p>
              <p className="text-sm opacity-80">Level {user?.level ?? 1}</p>
              <div className="w-full h-2 bg-[#1b2833]/20 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-[#1b2833] rounded-full"
                  style={{ width: `${(user?.totalXP ?? 0) % 100}%` }}
                />
              </div>
            </div>
          </section>

          {/* B) Last Week Rank Section */}
          <section className="flex-shrink-0 flex flex-col py-3 px-4">
            <p className="text-sm mb-3">Minulý týždeň si sa umiestnil:</p>
            <div className="flex flex-row gap-2 w-full">
              <div className="flex-1 flex flex-col items-center border border-[#1b2833] rounded-full py-3 px-2">
                <p className="text-xs opacity-80 mb-1">MYJAVA</p>
                <p className="font-bold text-lg">#8</p>
              </div>
              <div className="flex-1 flex flex-col items-center border border-[#1b2833] rounded-full py-3 px-2">
                <p className="text-xs opacity-80 mb-1">SLOVENSKO</p>
                <p className="font-bold text-lg">#8</p>
              </div>
              <div className="flex-1 flex flex-col items-center border border-[#1b2833] rounded-full py-3 px-2">
                <p className="text-xs opacity-80 mb-1">TVOJE MESTO</p>
                <p className="font-bold text-lg">#8</p>
              </div>
            </div>
          </section>

          {/* C) Countdown Section */}
          <section className="flex-shrink-0 py-2 px-4 text-center">
            <p className="text-sm">Placeholder countdown</p>
          </section>

          {/* D) Action Section */}
          <section className="flex-shrink-0 flex flex-col gap-2 p-4">
            <button
              type="button"
              onClick={() => console.log("PLAY")}
              className="w-full py-4 bg-[#1b2833] text-[#f3e6c0] rounded font-semibold"
            >
              HRÁŤ KVÍZ
            </button>
            <button
              type="button"
              onClick={() => console.log("LEADERBOARD")}
              className="w-full py-2 border border-[#1b2833] rounded"
            >
              LEADERBOARD
            </button>
            <button
              type="button"
              onClick={() => console.log("SETTINGS")}
              className="w-full py-2 border border-[#1b2833] rounded"
            >
              NASTAVENIA
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
