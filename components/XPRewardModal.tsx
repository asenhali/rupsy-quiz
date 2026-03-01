"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeContext } from "@/context/SwipeContext";
import { useXPReward } from "@/context/XPRewardContext";
import { calculateLevel } from "@/lib/xp";

const STAGE_1_FADE_IN = 500;
const STAGE_1_HOLD = 2000;
const STAGE_1_FADE_OUT = 500;
const STAGE_2_LINE_DELAY = 1200;
const STAGE_2_TOTAL_DELAY = 1500;
const STAGE_2_HOLD_AFTER_TOTAL = 2500;
const STAGE_2_FADE_OUT = 500;
const TRANSITION_BLACK = 500;
const STAGE_3_BAR_DURATION = 2000;
const STAGE_3_HOLD_AFTER_BAR = 800;
const STAGE_3_FADE_OUT = 500;
const STAGE_4_EXPLOSION = 500;
const STAGE_4_DRIP = 1000;
const STAGE_4_HOLD = 3000;
const STAGE_4_FADE_OUT = 500;

type ViewState =
  | { view: 1; phase: "in" | "hold" | "out" }
  | { view: "transition"; from: number }
  | { view: 2; phase: "in" | "hold" | "out"; breakdownLine: number; showTotal: boolean }
  | { view: 3; phase: "in" | "bar" | "hold" | "out" }
  | { view: 4; phase: "explosion" | "drip" | "hold"; showButton?: boolean }
  | { view: 5 };

export default function XPRewardModal() {
  const { xpRewardData, closeXPReward, isOpen } = useXPReward();
  const { setSwipeDisabled } = useSwipeContext();
  const [state, setState] = useState<ViewState>({ view: 1, phase: "in" });
  const [xpBarFillPercent, setXpBarFillPercent] = useState(0);
  const [displayedXP, setDisplayedXP] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setSwipeDisabled(isOpen);
    return () => setSwipeDisabled(false);
  }, [isOpen, setSwipeDisabled]);

  useEffect(() => {
    if (!isOpen || !xpRewardData) return;

    const oldTotalXP = xpRewardData.newTotalXP - xpRewardData.xpBreakdown.totalXP;
    setState({ view: 1, phase: "in" });
    setXpBarFillPercent(0);
    setDisplayedXP(oldTotalXP);
  }, [isOpen, xpRewardData]);

  useEffect(() => {
    if (!isOpen || !xpRewardData) return;

    const oldTotalXP = xpRewardData.newTotalXP - xpRewardData.xpBreakdown.totalXP;
    const levelBeforeData = calculateLevel(oldTotalXP);
    const levelAfterData = calculateLevel(xpRewardData.newTotalXP);

    if (state.view === 1 && state.phase === "in") {
      const t = setTimeout(() => setState({ view: 1, phase: "hold" }), STAGE_1_FADE_IN);
      return () => clearTimeout(t);
    }

    if (state.view === 1 && state.phase === "hold") {
      const t = setTimeout(() => setState({ view: 1, phase: "out" }), STAGE_1_HOLD);
      return () => clearTimeout(t);
    }

    if (state.view === 1 && state.phase === "out") {
      const t = setTimeout(() => setState({ view: "transition", from: 1 }), STAGE_1_FADE_OUT);
      return () => clearTimeout(t);
    }

    if (state.view === "transition" && state.from === 1) {
      const t = setTimeout(() => {
        setState({ view: 2, phase: "in", breakdownLine: 1, showTotal: false });
      }, TRANSITION_BLACK);
      return () => clearTimeout(t);
    }

    if (state.view === 2 && state.phase === "in") {
      const bl = state.breakdownLine;
      const st = state.showTotal;
      if (bl < 3) {
        const t = setTimeout(
          () => setState((s) => (s.view === 2 && s.phase === "in" ? { ...s, breakdownLine: bl + 1 } : s)),
          bl === 0 ? 400 : STAGE_2_LINE_DELAY
        );
        return () => clearTimeout(t);
      }
      if (!st) {
        const t = setTimeout(
          () => setState((s) => (s.view === 2 && s.phase === "in" ? { ...s, showTotal: true } : s)),
          STAGE_2_TOTAL_DELAY
        );
        return () => clearTimeout(t);
      }
      const t = setTimeout(
        () => setState({ view: 2, phase: "hold", breakdownLine: 3, showTotal: true }),
        400
      );
      return () => clearTimeout(t);
    }

    if (state.view === 2 && state.phase === "hold") {
      const t = setTimeout(
        () => setState({ view: 2, phase: "out", breakdownLine: 3, showTotal: true }),
        STAGE_2_HOLD_AFTER_TOTAL
      );
      return () => clearTimeout(t);
    }

    if (state.view === 2 && state.phase === "out") {
      const t = setTimeout(
        () => setState({ view: "transition", from: 2 }),
        STAGE_2_FADE_OUT
      );
      return () => clearTimeout(t);
    }

    if (state.view === "transition" && state.from === 2) {
      const t = setTimeout(() => {
        setState({ view: 3, phase: "in" });
        setDisplayedXP(oldTotalXP);
        setXpBarFillPercent(
          levelBeforeData.xpForNextLevel != null
            ? ((oldTotalXP - levelBeforeData.xpForCurrentLevel) /
                (levelBeforeData.xpForNextLevel - levelBeforeData.xpForCurrentLevel)) *
                100
            : 100
        );
      }, TRANSITION_BLACK);
      return () => clearTimeout(t);
    }

    if (state.view === 3 && state.phase === "in") {
      const t = setTimeout(() => setState({ view: 3, phase: "bar" }), 400);
      return () => clearTimeout(t);
    }

    if (state.view === 3 && state.phase === "bar") {
      const startFill =
        levelBeforeData.xpForNextLevel != null
          ? ((oldTotalXP - levelBeforeData.xpForCurrentLevel) /
              (levelBeforeData.xpForNextLevel - levelBeforeData.xpForCurrentLevel)) *
            100
          : 100;
      const leveledUp = xpRewardData.levelAfter > xpRewardData.levelBefore;
      const endFill =
        leveledUp && levelBeforeData.xpForNextLevel != null
          ? 100
          : levelAfterData.progressPercent;
      const endXP =
        leveledUp && levelBeforeData.xpForNextLevel != null
          ? levelBeforeData.xpForNextLevel
          : xpRewardData.newTotalXP;
      const startTime = Date.now();

      const animateBar = () => {
        const elapsed = Date.now() - startTime;
        const p = Math.min(1, elapsed / STAGE_3_BAR_DURATION);
        const eased = 1 - Math.pow(1 - p, 2);
        setXpBarFillPercent(startFill + (endFill - startFill) * eased);
        setDisplayedXP(Math.round(oldTotalXP + (endXP - oldTotalXP) * eased));
        if (p < 1) {
          rafRef.current = requestAnimationFrame(animateBar);
        }
      };
      rafRef.current = requestAnimationFrame(animateBar);

      const t = setTimeout(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setXpBarFillPercent(endFill);
        setDisplayedXP(endXP);
        setState(leveledUp ? { view: 4, phase: "explosion" } : { view: 3, phase: "hold" });
      }, STAGE_3_BAR_DURATION);
      return () => {
        clearTimeout(t);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }

    if (state.view === 3 && state.phase === "hold") {
      const t = setTimeout(() => setState({ view: 3, phase: "out" }), STAGE_3_HOLD_AFTER_BAR);
      return () => clearTimeout(t);
    }

    if (state.view === 3 && state.phase === "out") {
      const t = setTimeout(() => setState({ view: "transition", from: 3 }), STAGE_3_FADE_OUT);
      return () => clearTimeout(t);
    }

    if (state.view === "transition" && state.from === 3) {
      const t = setTimeout(() => setState({ view: 5 }), TRANSITION_BLACK);
      return () => clearTimeout(t);
    }

    if (state.view === 4 && state.phase === "explosion") {
      const t = setTimeout(() => setState({ view: 4, phase: "drip" }), STAGE_4_EXPLOSION);
      return () => clearTimeout(t);
    }

    if (state.view === 4 && state.phase === "drip") {
      const t = setTimeout(() => setState({ view: 4, phase: "hold" }), STAGE_4_DRIP);
      return () => clearTimeout(t);
    }

    if (state.view === 4 && state.phase === "hold" && !state.showButton) {
      const t = setTimeout(
        () => setState({ view: 4, phase: "hold", showButton: true }),
        STAGE_4_HOLD
      );
      return () => clearTimeout(t);
    }
  }, [isOpen, xpRewardData, state]);

  if (!isOpen || !xpRewardData) return null;

  const { xpBreakdown, levelBefore, levelAfter, newTotalXP } = xpRewardData;
  const oldTotalXP = newTotalXP - xpBreakdown.totalXP;
  const levelBeforeData = calculateLevel(oldTotalXP);
  const levelAfterData = calculateLevel(newTotalXP);
  const leveledUp = levelAfter > levelBefore;

  const breakdownLines = [
    "+30 XP za účasť",
    `+${xpBreakdown.correctXP} XP za správne odpovede`,
    `+${xpBreakdown.rankXP} XP za #${xpRewardData.rank} umiestnenie`,
  ];

  const currentBreakdown = state.view === 2 ? (state.breakdownLine ?? 0) : 0;
  const currentShowTotal = state.view === 2 ? (state.showTotal ?? false) : false;

  return (
    <div
      className="fixed inset-0 z-[101] bg-[#1b2833] text-[#f3e6c0] flex flex-col items-center justify-center font-['Montserrat']"
      style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh" }}
    >
      <AnimatePresence mode="wait">
        {state.view === 1 && (
          <motion.div
            key="stage1"
            initial={{ opacity: 0 }}
            animate={{ opacity: state.phase === "out" ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: state.phase === "in" ? STAGE_1_FADE_IN / 1000 : STAGE_1_FADE_OUT / 1000,
            }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <p className="text-3xl font-extrabold uppercase tracking-[0.2em]">TVOJE XP</p>
          </motion.div>
        )}

        {state.view === 2 && (
          <motion.div
            key="stage2"
            initial={{ opacity: 0 }}
            animate={{ opacity: state.phase === "out" ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: state.phase === "out" ? STAGE_2_FADE_OUT / 1000 : 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-6"
          >
            <div className="flex flex-col gap-4 items-center text-center">
              {breakdownLines.slice(0, currentBreakdown).map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-lg font-semibold"
                >
                  {line}
                </motion.p>
              ))}
              {currentShowTotal && (
                <motion.p
                  key="total"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-2xl font-extrabold mt-2 text-[#FFD700]"
                >
                  CELKOM +{xpBreakdown.totalXP} XP
                </motion.p>
              )}
            </div>
          </motion.div>
        )}

        {state.view === 3 && (
          <motion.div
            key="stage3"
            initial={{ opacity: 0 }}
            animate={{ opacity: state.phase === "out" ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: state.phase === "out" ? STAGE_3_FADE_OUT / 1000 : 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-6"
          >
            <div className="w-full max-w-[320px]">
              <p className="text-sm font-bold uppercase tracking-widest opacity-70 mb-3">
                LEVEL {levelBefore}
              </p>
              <div
                className="w-full rounded-full overflow-hidden border border-[#f3e6c0]/25"
                style={{ height: 12, background: "rgba(27,40,51,0.6)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0, xpBarFillPercent))}%`,
                    background: "linear-gradient(90deg, #FFD700 0%, #f3e6c0 100%)",
                  }}
                  transition={{ duration: 0.05 }}
                />
              </div>
              <p className="text-sm font-medium opacity-70 mt-2 tabular-nums">
                {levelBeforeData.xpForNextLevel != null
                  ? `${displayedXP} / ${levelBeforeData.xpForNextLevel} XP`
                  : `${displayedXP} XP (MAX)`}
              </p>
            </div>
          </motion.div>
        )}

        {state.view === 4 && (
          <motion.div
            key="stage4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Base content - LEVEL UP text (revealed as gold drips away) */}
            <div className="relative z-10 flex flex-col items-center justify-center flex-1">
              <motion.p
                className="text-4xl font-extrabold text-[#FFD700] uppercase tracking-wider"
                animate={{
                  textShadow: [
                    "0 0 20px rgba(255,215,0,0.4)",
                    "0 0 40px rgba(255,215,0,0.7)",
                    "0 0 20px rgba(255,215,0,0.4)",
                  ],
                }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                LEVEL UP!
              </motion.p>
              <p
                className="font-black mt-6 text-[#f3e6c0]"
                style={{ fontSize: "clamp(100px, 25vw, 140px)" }}
              >
                {levelAfter}
              </p>
              {state.showButton && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  type="button"
                  onClick={closeXPReward}
                  className="mt-12 px-12 py-4 rounded-2xl bg-[#f3e6c0] text-[#1b2833] font-bold text-sm uppercase tracking-wider"
                >
                  Pokračovať
                </motion.button>
              )}
            </div>

            {/* Gold explosion overlay - expands from center, then drips down */}
            {(state.phase === "explosion" || state.phase === "drip") && (
              <motion.div
                className="absolute inset-0 z-20 pointer-events-none w-full h-full"
                initial={{ scale: 0.05 }}
                animate={
                  state.phase === "explosion"
                    ? { scale: 1 }
                    : { scale: 1, y: "100%" }
                }
                transition={
                  state.phase === "explosion"
                    ? {
                        scale: {
                          duration: STAGE_4_EXPLOSION / 1000,
                          ease: [0.16, 1, 0.3, 1],
                        },
                      }
                    : {
                        y: {
                          duration: STAGE_4_DRIP / 1000,
                          ease: "easeIn",
                        },
                      }
                }
                style={{
                  background: "linear-gradient(180deg, #FFD700 0%, #E8C547 50%, #D4A017 100%)",
                  transformOrigin: "center center",
                }}
              />
            )}
          </motion.div>
        )}

        {state.view === 5 && (
          <motion.div
            key="stage5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center justify-center"
          >
            <button
              type="button"
              onClick={closeXPReward}
              className="px-12 py-4 rounded-2xl bg-[#f3e6c0] text-[#1b2833] font-bold text-sm uppercase tracking-wider"
            >
              Pokračovať
            </button>
          </motion.div>
        )}

        {state.view === "transition" && (
          <div key="transition" className="absolute inset-0 bg-[#1b2833]" />
        )}
      </AnimatePresence>
    </div>
  );
}
