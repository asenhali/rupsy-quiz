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
            {entries.map((entry) => (
              <div
                key={entry.rank}
                ref={entry.isCurrentUser ? currentUserRowRef : null}
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border ${
                  entry.isCurrentUser
                    ? "bg-[#1b2833] text-[#f3e6c0] border-[#1b2833]"
                    : "bg-white/40 border-[#1b2833]/[0.06] text-[#1b2833]"
                }`}
              >
                <span className="text-sm font-bold tabular-nums w-8">
                  #{entry.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{entry.nickname}</p>
                  {entry.city ? (
                    <p className={`text-xs truncate ${entry.isCurrentUser ? "opacity-70" : "opacity-50"}`}>
                      {entry.city}
                    </p>
                  ) : null}
                </div>
                <span className="text-sm font-bold tabular-nums">
                  {entry.score}
                </span>
              </div>
            ))}
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
