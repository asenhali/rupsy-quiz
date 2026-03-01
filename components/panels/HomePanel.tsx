"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SLOVAK_CITIES } from "@/config/cities";
import { useOnboarding } from "@/context/OnboardingContext";
import { useProfileModal } from "@/context/ProfileModalContext";

export default function HomePanel() {
  const router = useRouter();
  const { openProfile, user, setUser, setShowQuiz, showQuiz } = useProfileModal();
  const { setIsOnboarding } = useOnboarding();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [completedQuiz, setCompletedQuiz] = useState<{ totalScore: number } | null>(null);
  const [ranking, setRanking] = useState<{
    totalScore: number;
    slovakiaRank: number;
    slovakiaTotal: number;
    cityRank: number;
    cityTotal: number;
    cityName: string;
    citiesRank: number;
    citiesTotal: number;
  } | null>(null);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankDirection, setRankDirection] = useState<{
    cityRank: "up" | "down" | "same" | null;
    slovakiaRank: "up" | "down" | "same" | null;
    citiesRank: "up" | "down" | "same" | null;
  }>({ cityRank: null, slovakiaRank: null, citiesRank: null });
  const prevRankingRef = useRef<{
    slovakiaRank: number;
    cityRank: number;
    citiesRank: number;
  } | null>(null);

  const avatarMap: Record<string, string> = {
    default: "/avatars/default.png",
  };
  const [nickname, setNickname] = useState("");
  const [city, setCity] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsOnboarding(needsOnboarding === true);
  }, [needsOnboarding, setIsOnboarding]);

  const updateCitySuggestions = useCallback((value: string) => {
    const v = value.trim().toLowerCase();
    if (!v) {
      setCitySuggestions(SLOVAK_CITIES);
    } else {
      setCitySuggestions(SLOVAK_CITIES.filter((c) => c.toLowerCase().startsWith(v)));
    }
  }, []);

  useEffect(() => {
    if (showQuiz) return;
    async function initAuth() {
      const res = await fetch("/api/me", { credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        router.replace("/");
        return;
      }
      setNeedsOnboarding(json.needsOnboarding ?? null);
      setUser(json.user ?? null);
      const quizRes = await fetch("/api/quiz/current", { credentials: "include" });
      const quizJson = await quizRes.json();
      if (quizJson.success && quizJson.quiz?.status === "completed") {
        setCompletedQuiz({ totalScore: quizJson.quiz.totalScore ?? 0 });
      } else {
        setCompletedQuiz(null);
        setRanking(null);
      }
    }
    initAuth();
  }, [router, setUser, showQuiz]);

  useEffect(() => {
    if (!completedQuiz) {
      setRanking(null);
      setRankDirection({ cityRank: null, slovakiaRank: null, citiesRank: null });
      prevRankingRef.current = null;
      return;
    }
    if (showQuiz) return;

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    setRankingLoading(true);
    setRanking(null);
    setRankDirection({ cityRank: null, slovakiaRank: null, citiesRank: null });
    prevRankingRef.current = null;
    fetch("/api/quiz/my-ranking", { credentials: "include" })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled || !json.success) return;
        if (json.ranking) {
          const r = json.ranking;
          const prev = prevRankingRef.current;
          const dir = {
            cityRank: (prev ? (r.cityRank < prev.cityRank ? "up" : r.cityRank > prev.cityRank ? "down" : "same") : null) as "up" | "down" | "same" | null,
            slovakiaRank: (prev ? (r.slovakiaRank < prev.slovakiaRank ? "up" : r.slovakiaRank > prev.slovakiaRank ? "down" : "same") : null) as "up" | "down" | "same" | null,
            citiesRank: (prev ? (r.citiesRank < prev.citiesRank ? "up" : r.citiesRank > prev.citiesRank ? "down" : "same") : null) as "up" | "down" | "same" | null,
          };
          prevRankingRef.current = { cityRank: r.cityRank, slovakiaRank: r.slovakiaRank, citiesRank: r.citiesRank };
          setRankDirection(dir);
          setRanking(r);
        }
        intervalId = setInterval(() => {
          fetch("/api/quiz/my-ranking", { credentials: "include" })
            .then((r) => r.json())
            .then((data) => {
              if (!cancelled && data.success && data.ranking) {
                const r = data.ranking;
                const prev = prevRankingRef.current;
                const dir = {
                  cityRank: (prev ? (r.cityRank < prev.cityRank ? "up" : r.cityRank > prev.cityRank ? "down" : "same") : null) as "up" | "down" | "same" | null,
                  slovakiaRank: (prev ? (r.slovakiaRank < prev.slovakiaRank ? "up" : r.slovakiaRank > prev.slovakiaRank ? "down" : "same") : null) as "up" | "down" | "same" | null,
                  citiesRank: (prev ? (r.citiesRank < prev.citiesRank ? "up" : r.citiesRank > prev.citiesRank ? "down" : "same") : null) as "up" | "down" | "same" | null,
                };
                prevRankingRef.current = { cityRank: r.cityRank, slovakiaRank: r.slovakiaRank, citiesRank: r.citiesRank };
                setRankDirection(dir);
                setRanking(r);
              }
            });
        }, 5_000);
      })
      .finally(() => {
        if (!cancelled) setRankingLoading(false);
      });

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [completedQuiz, showQuiz]);

  return (
    <div className="h-full overflow-hidden flex flex-col bg-[#f3e6c0] text-[#1b2833]">
      {needsOnboarding === true && (
        <div className="h-full overflow-hidden flex flex-col bg-[#f3e6c0] text-[#1b2833]">
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[480px] mx-auto px-6">
            <div className="mb-10 text-center">
              <p className="text-4xl font-extrabold tracking-tight">RUPSY</p>
              <p className="text-4xl font-extrabold tracking-tight opacity-40">KVÍZ</p>
              <p className="text-xs font-medium uppercase tracking-[0.2em] opacity-30 mt-3">TÝŽDENNÁ KVÍZOVÁ LIGA</p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const matchedCity = SLOVAK_CITIES.find((c) => c.toLowerCase() === city.trim().toLowerCase());
                const cityToSend = matchedCity ?? city.trim();
                const res = await fetch("/api/onboarding", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ nickname, city: cityToSend }),
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
              className="w-full space-y-4"
            >
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Prezývka"
                className="w-full p-4 border border-[#1b2833]/10 rounded-2xl bg-white/40 text-base font-medium placeholder:opacity-30"
              />

              <div className="relative">
                <input
                  ref={cityInputRef}
                  type="text"
                  value={city}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCity(v);
                    updateCitySuggestions(v);
                  }}
                  onFocus={() => {
                    setShowCitySuggestions(true);
                    if (!city.trim()) {
                      setCitySuggestions(SLOVAK_CITIES);
                    } else {
                      updateCitySuggestions(city);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowCitySuggestions(false), 150);
                  }}
                  placeholder="Mesto"
                  className="w-full p-4 border border-[#1b2833]/10 rounded-2xl bg-white/40 text-base font-medium placeholder:opacity-30"
                  autoComplete="off"
                />
                {showCitySuggestions && citySuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-white/95 backdrop-blur-xl rounded-2xl border border-[#1b2833]/10 max-h-[200px] overflow-y-auto shadow-[0_8px_30px_rgba(27,40,51,0.1)]">
                    {citySuggestions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setCity(c);
                          setCitySuggestions([]);
                          setShowCitySuggestions(false);
                          cityInputRef.current?.blur();
                        }}
                        className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-[#1b2833]/5 border-0 bg-transparent"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!nickname.trim() || !SLOVAK_CITIES.some((c) => c.toLowerCase() === city.trim().toLowerCase())}
                className="w-full py-4 bg-[#1b2833] text-[#f3e6c0] rounded-2xl font-bold text-base tracking-wide mt-2 disabled:opacity-40 disabled:pointer-events-none"
              >
                Začať hrať
              </button>
            </form>
          </div>
        </div>
      )}

      {needsOnboarding !== true && (
        <div className="flex-1 flex flex-col w-full max-w-[480px] mx-auto overflow-y-auto">
          <section className="flex items-center gap-3 px-5 pt-12 pb-8">
            <button
              type="button"
              onClick={openProfile}
              className="border-0 bg-transparent p-0 cursor-pointer flex-shrink-0"
            >
              <img
                src={avatarMap[user?.avatarId ?? ""] || avatarMap.default}
                alt="avatar"
                className="w-16 h-16 rounded-full object-cover border-2 border-[#1b2833]/10"
              />
            </button>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className="text-base font-semibold tracking-tight truncate">{user?.nickname ?? ""}</p>
              <p className="text-[10px] font-medium uppercase tracking-widest opacity-35">Level {user?.level ?? 1}</p>
              <div className="w-full max-w-[140px] h-1.5 bg-[#1b2833]/10 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-[#1b2833] rounded-full"
                  style={{ width: `${Math.max((user?.totalXP ?? 0) % 100, 2)}%` }}
                />
              </div>
              <p className="text-[9px] font-medium opacity-25 mt-0.5">{user?.totalXP ?? 0} / {(user?.level ?? 1) * 100} XP</p>
            </div>
            <div className="flex items-center gap-1.5 bg-[#1b2833]/[0.07] rounded-full px-3 py-1.5 shrink-0">
              <span className="w-5 h-5 rounded-full bg-[#1b2833] text-[#f3e6c0] text-[10px] font-bold flex items-center justify-center">R</span>
              <span className="text-sm font-semibold">{user?.rCoins ?? 0}</span>
            </div>
          </section>

          <section className="mx-5 mt-2 rounded-3xl bg-[#1b2833] py-8 px-6 flex flex-col items-center text-[#f3e6c0] shadow-[0_8px_30px_rgba(27,40,51,0.15)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-50 mb-3">TÝŽDENNÝ KVÍZ</p>
            {completedQuiz ? (
              <>
                <p className="text-xs opacity-50 mt-1">Tvoje skóre</p>
                <p className="text-4xl font-extrabold mt-2">{completedQuiz.totalScore}</p>
                <div className="w-full mt-4 py-4 px-2 flex justify-between items-center gap-2 text-[#f3e6c0]">
                  <div className="flex flex-col items-center flex-1">
                    <span className="text-[9px] uppercase tracking-widest opacity-50">{(ranking?.cityName ?? "MESTO").toUpperCase()}</span>
                    <span className="text-lg font-bold text-[#f3e6c0] mt-1">
                      {rankingLoading ? (
                        <span className="animate-pulse opacity-60">...</span>
                      ) : ranking && ranking.cityRank > 0 ? (
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={ranking.cityRank}
                            initial={
                              rankDirection.cityRank === "down"
                                ? { y: -15, opacity: 0, color: "#ef4444" }
                                : rankDirection.cityRank === "up"
                                  ? { y: 15, opacity: 0, color: "#22c55e" }
                                  : { y: 0, opacity: 1, color: "#f3e6c0" }
                            }
                            animate={{ y: 0, opacity: 1, color: "#f3e6c0" }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.5 }}
                            className="inline-block"
                          >
                            #{ranking.cityRank}
                          </motion.span>
                        </AnimatePresence>
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col items-center flex-1 border-l border-[#f3e6c0]/10 pl-2">
                    <span className="text-[9px] uppercase tracking-widest opacity-50">SLOVENSKO</span>
                    <span className="text-xl font-bold text-[#f3e6c0] mt-1">
                      {rankingLoading ? (
                        <span className="animate-pulse opacity-60">...</span>
                      ) : ranking && ranking.slovakiaRank > 0 ? (
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={ranking.slovakiaRank}
                            initial={
                              rankDirection.slovakiaRank === "down"
                                ? { y: -15, opacity: 0, color: "#ef4444" }
                                : rankDirection.slovakiaRank === "up"
                                  ? { y: 15, opacity: 0, color: "#22c55e" }
                                  : { y: 0, opacity: 1, color: "#f3e6c0" }
                            }
                            animate={{ y: 0, opacity: 1, color: "#f3e6c0" }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.5 }}
                            className="inline-block"
                          >
                            #{ranking.slovakiaRank}
                          </motion.span>
                        </AnimatePresence>
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col items-center flex-1 border-l border-[#f3e6c0]/10 pl-2">
                    <span className="text-[9px] uppercase tracking-widest opacity-50">MESTÁ</span>
                    <span className="text-lg font-bold text-[#f3e6c0] mt-1">
                      {rankingLoading ? (
                        <span className="animate-pulse opacity-60">...</span>
                      ) : ranking && ranking.citiesRank > 0 ? (
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={ranking.citiesRank}
                            initial={
                              rankDirection.citiesRank === "down"
                                ? { y: -15, opacity: 0, color: "#ef4444" }
                                : rankDirection.citiesRank === "up"
                                  ? { y: 15, opacity: 0, color: "#22c55e" }
                                  : { y: 0, opacity: 1, color: "#f3e6c0" }
                            }
                            animate={{ y: 0, opacity: 1, color: "#f3e6c0" }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.5 }}
                            className="inline-block"
                          >
                            #{ranking.citiesRank}
                          </motion.span>
                        </AnimatePresence>
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] font-medium uppercase tracking-widest opacity-30 mt-4">KVÍZ DOKONČENÝ ✓</p>
              </>
            ) : (
              <>
                <p className="text-base font-medium opacity-70 mb-8">Štartuje čoskoro</p>
                <button
                  type="button"
                  onClick={() => setShowQuiz(true)}
                  className="w-full py-4 rounded-2xl bg-[#f3e6c0] text-[#1b2833] font-bold text-base tracking-wide text-center"
                >
                  HRÁŤ KVÍZ
                </button>
                <p className="text-[10px] font-medium uppercase tracking-widest opacity-30 mt-3">SEZÓNA 1</p>
              </>
            )}
          </section>

          <div className="flex-1 min-h-[16px]" />

          <section className="mx-5 mb-2 rounded-2xl bg-white/40 border border-[#1b2833]/[0.06] p-4 shadow-[0_2px_12px_rgba(27,40,51,0.04)]">
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

          <div className="mx-5 mb-4">
            <button
              type="button"
              onClick={() => console.log("LEADERBOARD")}
              className="w-full py-3 rounded-2xl bg-[#1b2833]/[0.06] border border-[#1b2833]/[0.04] text-center text-xs font-semibold uppercase tracking-widest opacity-50"
            >
              REBRÍČEK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
