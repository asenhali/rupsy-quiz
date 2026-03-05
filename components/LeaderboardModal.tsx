"use client";

import { useEffect, useRef, useState } from "react";
import { useSwipeContext } from "@/context/SwipeContext";
import LeaderboardAvatar from "@/components/LeaderboardAvatar";

const EMPTY_REF = { current: null as HTMLDivElement | null };

const TOP3_STROKE: Record<number, { base: string; bright: string }> = {
  1: { base: "#FFD700", bright: "#FFF44F" },
  2: { base: "#C0C0C0", bright: "#F0F0F0" },
  3: { base: "#CD7F32", bright: "#DFA04E" },
};

function Top3Card({
  entry,
  cardClass,
  cardContent,
  isCurrentUserRef,
}: {
  entry: { rank: number };
  cardClass: string;
  cardContent: React.ReactNode;
  isCurrentUserRef: React.RefObject<HTMLDivElement | null>;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const update = () => {
      setDim({ w: el.offsetWidth, h: el.offsetHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rank = entry.rank as 1 | 2 | 3;
  const stroke = TOP3_STROKE[rank];
  const rx = 16;

  return (
    <div
      ref={isCurrentUserRef}
      className="relative overflow-visible"
    >
      <div ref={cardRef} className={`${cardClass} rounded-2xl relative z-[1]`}>
        {cardContent}
      </div>
      {dim && dim.w > 0 && dim.h > 0 && (
        <svg
          className="leaderboard-svg-glow absolute inset-0 w-full h-full pointer-events-none z-[2] overflow-visible"
          width="100%"
          height="100%"
        >
          <defs>
            <filter id={`snakeGlow-${entry.rank}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
            </filter>
          </defs>
          <rect
            x="1"
            y="1"
            width={dim.w - 2}
            height={dim.h - 2}
            rx={rx}
            ry={rx}
            fill="none"
            stroke={stroke.base}
            strokeWidth="2"
            strokeOpacity="0.7"
          />
          <rect
            className="leaderboard-glow-animated"
            x="1"
            y="1"
            width={dim.w - 2}
            height={dim.h - 2}
            rx={rx}
            ry={rx}
            fill="none"
            stroke={stroke.bright}
            strokeWidth="3"
            strokeOpacity="0.9"
            pathLength="100"
            strokeDasharray="20 80"
            filter={`url(#snakeGlow-${entry.rank})`}
          />
        </svg>
      )}
    </div>
  );
}

type TabId = "slovensko" | "mesto" | "mesta";

type LeaderboardEntry = {
  rank: number;
  nickname: string;
  city: string;
  score: number;
  isCurrentUser: boolean;
  equippedAvatar?: string;
  equippedAvatarBackground?: string | null;
  equippedAvatarFrame?: string | null;
};

type CitiesEntry = {
  rank: number;
  city: string;
  averageScore: number;
  playerCount: number;
  isCurrentCity: boolean;
};

type UserRank = {
  rank: number;
  score: number;
} | null;

type CitiesUserRank = {
  rank: number;
  averageScore: number;
  playerCount: number;
} | null;

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const TABS: { id: TabId; label: string }[] = [
  { id: "mesto", label: "MESTO" },
  { id: "slovensko", label: "SLOVENSKO" },
  { id: "mesta", label: "MESTÁ" },
];

export default function LeaderboardModal({ isOpen, onClose }: Props) {
  const { setSwipeDisabled } = useSwipeContext();
  const [activeTab, setActiveTab] = useState<TabId>("slovensko");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [citiesEntries, setCitiesEntries] = useState<CitiesEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRank>(null);
  const [citiesUserRank, setCitiesUserRank] = useState<CitiesUserRank>(null);
  const [cityName, setCityName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const currentUserRowRef = useRef<HTMLDivElement>(null);
  const currentCityRowRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSwipeDisabled(isOpen);
    return () => setSwipeDisabled(false);
  }, [isOpen, setSwipeDisabled]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab("slovensko");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (activeTab === "slovensko") {
      setLoading(true);
      setEntries([]);
      setUserRank(null);
      fetch("/api/quiz/leaderboard", { credentials: "include" })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setEntries(json.entries ?? []);
            setUserRank(json.userRank ?? null);
          }
        })
        .finally(() => setLoading(false));
    } else if (activeTab === "mesto") {
      setLoading(true);
      setEntries([]);
      setUserRank(null);
      setCityName("");
      fetch("/api/quiz/leaderboard-city?type=city", { credentials: "include" })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setEntries(json.entries ?? []);
            setUserRank(json.userRank ?? null);
            setCityName(json.cityName ?? "");
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(true);
      setCitiesEntries([]);
      setCitiesUserRank(null);
      fetch("/api/quiz/leaderboard-city?type=cities", { credentials: "include" })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setCitiesEntries(json.entries ?? []);
            setCitiesUserRank(json.userRank ?? null);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (!isOpen || loading) return;
    if (activeTab === "slovensko" || activeTab === "mesto") {
      if (entries.length === 0) return;
      const hasCurrentUser = entries.some((e) => e.isCurrentUser);
      if (hasCurrentUser && currentUserRowRef.current && listRef.current) {
        currentUserRowRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    } else if (activeTab === "mesta" && citiesEntries.length > 0) {
      const hasCurrentCity = citiesEntries.some((e) => e.isCurrentCity);
      if (hasCurrentCity && currentCityRowRef.current && listRef.current) {
        currentCityRowRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [isOpen, loading, activeTab, entries, citiesEntries]);

  if (!isOpen) return null;

  const currentUserEntry = entries.find((e) => e.isCurrentUser);
  const currentCityEntry = citiesEntries.find((e) => e.isCurrentCity);

  let displayRank: number | null = null;
  let displayScore: number | null = null;
  let rankLabel = "";

  if (activeTab === "slovensko") {
    displayRank = currentUserEntry?.rank ?? userRank?.rank ?? null;
    displayScore = currentUserEntry?.score ?? userRank?.score ?? null;
    rankLabel = "na Slovensku";
  } else if (activeTab === "mesto") {
    displayRank = currentUserEntry?.rank ?? userRank?.rank ?? null;
    displayScore = currentUserEntry?.score ?? userRank?.score ?? null;
    rankLabel = cityName ? `v ${cityName}` : "v meste";
  } else {
    displayRank = currentCityEntry?.rank ?? citiesUserRank?.rank ?? null;
    displayScore = currentCityEntry?.averageScore ?? citiesUserRank?.averageScore ?? null;
    rankLabel = "medzi mestami";
  }

  const showStickyStats = displayRank != null && displayScore != null;

  function rankBadge(rank: number) {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    if (rank === 4) return "🥔";
    return null;
  }

  return (
    <div className="fixed top-0 left-0 w-screen h-screen z-[100] bg-[#f3e6c0] flex flex-col">
      <div className="flex-shrink-0 px-4 pt-10 pb-4 border-b border-[#1b2833]/[0.06]">
        <div className="flex items-center gap-3 max-w-[480px] mx-auto">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 bg-transparent text-sm font-medium opacity-50 text-[#1b2833] border-0"
          >
            ← Späť
          </button>
          <h1 className="text-xl font-bold text-[#1b2833]">REBRÍČEK</h1>
        </div>
        {!loading && showStickyStats && (
          <p className="text-sm font-medium text-[#1b2833]/70 max-w-[480px] mx-auto mt-2">
            Tvoje skóre: {displayScore} • #{displayRank} {rankLabel}
          </p>
        )}
        <div className="flex gap-1 mt-3 max-w-[480px] mx-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                activeTab === tab.id
                  ? "bg-[#1b2833] text-[#f3e6c0]"
                  : "bg-[#1b2833]/10 text-[#1b2833]/60 hover:bg-[#1b2833]/15"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-4 max-w-[480px] mx-auto w-full"
      >
        {loading ? (
          <p className="text-sm opacity-50 text-center py-8">Načítavam...</p>
        ) : activeTab === "mesta" ? (
          citiesEntries.length === 0 ? (
            <p className="text-sm opacity-50 text-center py-8">Žiadne výsledky</p>
          ) : (
            <div className="space-y-2">
              {citiesEntries.map((entry) => {
                const isTop10 = entry.rank >= 1 && entry.rank <= 10;
                const isTop3 = entry.rank >= 1 && entry.rank <= 3;
                const badge = rankBadge(entry.rank);
                const cardClass = `flex items-center justify-between gap-3 px-4 py-3 ${
                  entry.isCurrentCity
                    ? "bg-[#1b2833] text-[#f3e6c0]"
                    : "bg-white/40 text-[#1b2833]"
                } ${isTop10 && !entry.isCurrentCity && !isTop3 ? "border-l-4 border-l-[#c9a227]/60 bg-[#f3e6c0]/30" : ""}`;

                const cardContent = (
                  <>
                    <span className="text-sm font-bold tabular-nums w-12 flex items-center gap-1 shrink-0">
                      {badge}
                      #{entry.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold flex items-center gap-2">
                        <span className="truncate">{entry.city}</span>
                        {entry.isCurrentCity && (
                          <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f3e6c0]/30 text-[#f3e6c0]">
                            TY
                          </span>
                        )}
                      </p>
                      <p className={`text-xs ${entry.isCurrentCity ? "opacity-70" : "opacity-50"}`}>
                        {entry.playerCount} {entry.playerCount === 1 ? "hráč" : "hráčov"}
                      </p>
                    </div>
                    <span className="text-sm font-bold tabular-nums">
                      {entry.averageScore}
                    </span>
                  </>
                );

                if (isTop3) {
                  return (
                    <Top3Card
                      key={entry.rank}
                      entry={entry}
                      cardClass={cardClass}
                      cardContent={cardContent}
                      isCurrentUserRef={entry.isCurrentCity ? currentCityRowRef : EMPTY_REF}
                    />
                  );
                }

                return (
                  <div
                    key={entry.rank}
                    ref={entry.isCurrentCity ? currentCityRowRef : null}
                    className={`rounded-2xl border ${cardClass} ${
                      !entry.isCurrentCity ? "border-[#1b2833]/[0.06]" : "border-[#1b2833]"
                    }`}
                  >
                    {cardContent}
                  </div>
                );
              })}
            </div>
          )
        ) : entries.length === 0 ? (
          <p className="text-sm opacity-50 text-center py-8">Žiadne výsledky</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              const isTop10 = entry.rank >= 1 && entry.rank <= 10;
              const isTop3 = entry.rank >= 1 && entry.rank <= 3;
              const badge = rankBadge(entry.rank);
              const cardClass = `flex items-center justify-between gap-3 px-4 py-3 ${
                entry.isCurrentUser
                  ? "bg-[#1b2833] text-[#f3e6c0]"
                  : "bg-white/40 text-[#1b2833]"
              } ${isTop10 && !entry.isCurrentUser && !isTop3 ? "border-l-4 border-l-[#c9a227]/60 bg-[#f3e6c0]/30" : ""}`;

              const cardContent = (
                <>
                  <span className="text-sm font-bold tabular-nums w-12 flex items-center gap-1 shrink-0">
                    {badge}
                    #{entry.rank}
                  </span>
                  <LeaderboardAvatar
                    equippedAvatar={entry.equippedAvatar ?? "rupsik"}
                    equippedAvatarBackground={entry.equippedAvatarBackground ?? null}
                    equippedAvatarFrame={entry.equippedAvatarFrame ?? null}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold flex items-center gap-2">
                      <span className="truncate">{entry.nickname}</span>
                      {entry.isCurrentUser && (
                        <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f3e6c0]/30 text-[#f3e6c0]">
                          TY
                        </span>
                      )}
                    </p>
                    {entry.city ? (
                      <p className={`text-xs truncate ${entry.isCurrentUser ? "opacity-70" : "opacity-50"}`}>
                        {entry.city}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-sm font-bold tabular-nums">
                    {entry.score}
                  </span>
                </>
              );

              if (isTop3) {
                return (
                  <Top3Card
                    key={entry.rank}
                    entry={entry}
                    cardClass={cardClass}
                    cardContent={cardContent}
                    isCurrentUserRef={entry.isCurrentUser ? currentUserRowRef : EMPTY_REF}
                  />
                );
              }

              return (
                <div
                  key={entry.rank}
                  ref={entry.isCurrentUser ? currentUserRowRef : null}
                  className={`rounded-2xl border ${cardClass} ${
                    !entry.isCurrentUser ? "border-[#1b2833]/[0.06]" : "border-[#1b2833]"
                  }`}
                >
                  {cardContent}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!loading && activeTab !== "mesta" && userRank && !entries.some((e) => e.isCurrentUser) && (
        <div className="flex-shrink-0 px-4 py-4 border-t border-[#1b2833]/[0.06] bg-[#1b2833] text-[#f3e6c0] max-w-[480px] mx-auto w-full">
          <p className="text-sm font-semibold text-center">
            Tvoja pozícia: #{userRank.rank} — {userRank.score} pts
          </p>
        </div>
      )}
    </div>
  );
}
