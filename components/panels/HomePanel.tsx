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
        <div className="flex-1 flex flex-col w-full max-w-[480px] mx-auto pt-10">
          <section className="flex-shrink-0 flex flex-row items-center gap-4 py-2 px-4">
            <button
              type="button"
              onClick={openProfile}
              className="border-0 bg-transparent p-0 cursor-pointer flex-shrink-0"
            >
              <img
                src={avatarMap[user?.avatarId ?? ""] || avatarMap.default}
                alt="avatar"
                className="w-[72px] h-[72px] rounded-full object-cover border-2 border-[#1b2833]/10"
              />
            </button>
            <div className="flex-1 flex flex-col justify-center min-w-0">
              <p className="text-xl font-semibold tracking-tight">{user?.nickname ?? ""}</p>
              <p className="text-xs font-medium uppercase tracking-widest opacity-40">Level {user?.level ?? 1}</p>
              <div className="w-full h-1.5 bg-[#1b2833]/15 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-[#1b2833] rounded-full"
                  style={{ width: `${(user?.totalXP ?? 0) % 100}%` }}
                />
              </div>
            </div>
          </section>

          <section className="flex-shrink-0 flex flex-col py-3 px-4 pb-8">
            <p className="text-xs font-medium uppercase tracking-widest opacity-40 mb-4">Minulý týždeň si sa umiestnil:</p>
            <div className="flex flex-row items-end gap-2 w-full">
              <div className="flex-1 flex flex-col items-center bg-white/40 border border-[#1b2833]/[0.06] rounded-2xl py-2 px-2 mt-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest opacity-40 mb-1">
                  {(user?.city ?? "Tvoje mesto").toUpperCase()}
                </p>
                <p className="font-extrabold text-xl">#8</p>
              </div>
              <div className="flex-[1.2] flex flex-col items-center bg-white/60 border border-[#1b2833]/[0.08] rounded-2xl py-4 px-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest opacity-40 mb-1">SLOVENSKO</p>
                <p className="font-extrabold text-3xl">#8</p>
              </div>
              <div className="flex-1 flex flex-col items-center bg-white/40 border border-[#1b2833]/[0.06] rounded-2xl py-2 px-2 mt-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest opacity-40 mb-1">TVOJE MESTO</p>
                <p className="font-extrabold text-xl">#8</p>
              </div>
            </div>
          </section>

          <section className="flex-shrink-0 py-6 px-4 text-center">
            <p className="text-xs font-medium uppercase tracking-widest opacity-30">Placeholder countdown</p>
          </section>

          <section className="flex-shrink-0 flex flex-col gap-2 mt-auto pt-4 pb-6 px-4">
            <button
              type="button"
              onClick={() => console.log("PLAY")}
              className="w-full py-4 bg-[#1b2833] text-[#f3e6c0] rounded-2xl font-semibold text-base tracking-wide"
            >
              HRÁŤ KVÍZ
            </button>
            <button
              type="button"
              onClick={() => console.log("LEADERBOARD")}
              className="w-full py-3 bg-[#1b2833]/5 text-[#1b2833] rounded-2xl font-medium text-sm tracking-wide border-0"
            >
              LEADERBOARD
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
