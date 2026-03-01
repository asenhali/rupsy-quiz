"use client";

import { useEffect, useRef, useState } from "react";
import { useSwipeContext } from "@/context/SwipeContext";

type LeaderboardEntry = {
  rank: number;
  nickname: string;
  city: string;
  score: number;
  isCurrentUser: boolean;
};

type UserRank = {
  rank: number;
  score: number;
} | null;

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function LeaderboardModal({ isOpen, onClose }: Props) {
  const { setSwipeDisabled } = useSwipeContext();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRank>(null);
  const [loading, setLoading] = useState(true);
  const currentUserRowRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSwipeDisabled(isOpen);
    return () => setSwipeDisabled(false);
  }, [isOpen, setSwipeDisabled]);

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || loading || entries.length === 0) return;
    const hasCurrentUser = entries.some((e) => e.isCurrentUser);
    if (hasCurrentUser && currentUserRowRef.current && listRef.current) {
      currentUserRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [isOpen, loading, entries]);

  if (!isOpen) return null;

  const currentUserEntry = entries.find((e) => e.isCurrentUser);
  const displayRank = currentUserEntry?.rank ?? userRank?.rank ?? null;
  const displayScore = currentUserEntry?.score ?? userRank?.score ?? null;
  const showStickyStats = displayRank != null && displayScore != null;

  function rankBadge(rank: number) {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    if (rank === 4) return "🥔";
    return null;
  }

  const top3StrokeColor: Record<number, string> = {
    1: "#FFD700",
    2: "#C0C0C0",
    3: "#CD7F32",
  };

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
            Tvoje skóre: {displayScore} • #{displayRank} na Slovensku
          </p>
        )}
      </div>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-4 max-w-[480px] mx-auto w-full"
      >
        {loading ? (
          <p className="text-sm opacity-50 text-center py-8">Načítavam...</p>
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
                  <div
                    key={entry.rank}
                    ref={entry.isCurrentUser ? currentUserRowRef : null}
                    className="relative"
                  >
                    <div className={`${cardClass} rounded-2xl relative z-[1]`}>
                      {cardContent}
                    </div>
                    <svg
                      className="leaderboard-border-svg absolute inset-0 w-full h-full pointer-events-none z-[2] rounded-2xl"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      <rect
                        x="1.5"
                        y="1.5"
                        width="97"
                        height="97"
                        rx="14"
                        ry="14"
                        fill="none"
                        stroke={top3StrokeColor[entry.rank as 1 | 2 | 3]}
                        strokeWidth="3"
                        pathLength="100"
                      />
                    </svg>
                  </div>
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

      {!loading && userRank && !entries.some((e) => e.isCurrentUser) && (
        <div className="flex-shrink-0 px-4 py-4 border-t border-[#1b2833]/[0.06] bg-[#1b2833] text-[#f3e6c0] max-w-[480px] mx-auto w-full">
          <p className="text-sm font-semibold text-center">
            Tvoja pozícia: #{userRank.rank} — {userRank.score} pts
          </p>
        </div>
      )}
    </div>
  );
}
