"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeContext } from "@/context/SwipeContext";
import { useXPReward } from "@/context/XPRewardContext";
import { calculateLevel } from "@/lib/xp";
import ParticleExplosion from "@/components/ParticleExplosion";

const COINS_STATIC_PAUSE = 1000;
const COINS_COUNT_DURATION = 1500;
const COINS_HOLD_AFTER = 1500;
const COINS_BUTTON_DELAY = 3000;
const STAGE_1_FADE_IN = 500;
const STAGE_1_HOLD = 1500;
const STAGE_1_FADE_OUT = 400;
const STAGE_2_LINE_DELAY = 1000;
const STAGE_2_TOTAL_DELAY = 1500;
const STAGE_2_HOLD_AFTER_TOTAL = 2000;
const STAGE_2_FADE_OUT = 500;
const TRANSITION_DURATION = 400;
const STAGE_3_BAR_DURATION = 2500;
const STAGE_3_HOLD_AFTER_BAR = 800;
const STAGE_3_FADE_OUT = 500;
const LEVEL_UP_TEXT_DELAY = 0;
const LEVEL_UP_NUMBER_DELAY = 300;
const LEVEL_UP_BUTTON_DELAY = 2500;

type ViewState =
  | { view: 0; phase: "in" | "hold" | "out"; showCoinButton?: boolean }
  | { view: 1; phase: "in" | "hold" | "out" }
  | { view: "transition"; from: number }
  | { view: 2; phase: "in" | "hold" | "out"; breakdownLine: number; showTotal: boolean }
  | { view: 3; phase: "in" | "bar" | "hold" | "particles" | "out" }
  | { view: 4; phase: "hold"; showButton?: boolean }
  | { view: 5 };

export default function XPRewardModal() {
  const { xpRewardData, closeXPReward, isOpen } = useXPReward();
  const { setSwipeDisabled } = useSwipeContext();
  const [state, setState] = useState<ViewState>({ view: 0, phase: "in" });
  const [xpBarFillPercent, setXpBarFillPercent] = useState(0);
  const [displayedXP, setDisplayedXP] = useState(0);
  const [displayedTotalXP, setDisplayedTotalXP] = useState(0);
  const [displayedCoins, setDisplayedCoins] = useState(0);
  const [particlesActive, setParticlesActive] = useState(false);
  const [particleSpawn, setParticleSpawn] = useState<{ x: number; y: number } | null>(null);
  const [levelUpTextEntranceDone, setLevelUpTextEntranceDone] = useState(false);
  const [levelNumberEntranceDone, setLevelNumberEntranceDone] = useState(false);
  const rafRef = useRef<number | null>(null);
  const barContainerRef = useRef<HTMLDivElement | null>(null);
  const pokracovatButtonRef = useRef<HTMLButtonElement | null>(null);
  const [buttonDim, setButtonDim] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    setSwipeDisabled(isOpen);
    return () => setSwipeDisabled(false);
  }, [isOpen, setSwipeDisabled]);

  useEffect(() => {
    const el = pokracovatButtonRef.current;
    const showButton = state.view === 4 ? state.showButton : undefined;
    if (!el || state.view !== 4 || !showButton) return;
    const update = () => setButtonDim({ w: el.offsetWidth, h: el.offsetHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [state.view, state.view === 4 ? state.showButton : undefined]);

  useEffect(() => {
    const showTotal =
      state.view === 2 && state.phase === "in" && state.showTotal;
    if (!xpRewardData || !showTotal) return;
    const total = xpRewardData.xpBreakdown.totalXP;
    const duration = 600;
    const step = 20;
    const steps = Math.ceil(duration / step);
    const increment = total / steps;
    let current = 0;
    const id = setInterval(() => {
      current += increment;
      if (current >= total) {
        setDisplayedTotalXP(total);
        return;
      }
      setDisplayedTotalXP(Math.floor(current));
    }, step);
    const done = setTimeout(() => setDisplayedTotalXP(total), duration);
    return () => {
      clearInterval(id);
      clearTimeout(done);
    };
  }, [xpRewardData, state]);

  useEffect(() => {
    const isCoinsView = state.view === 0 && state.phase === "in";
    if (!xpRewardData || !isCoinsView) return;
    const prev = xpRewardData.previousRCoins ?? 0;
    const next = xpRewardData.newRCoins ?? prev;
    if (prev >= next) return;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let doneId: ReturnType<typeof setTimeout> | null = null;
    const startId = setTimeout(() => {
      const duration = COINS_COUNT_DURATION;
      const step = 30;
      const steps = Math.ceil(duration / step);
      const increment = (next - prev) / steps;
      let current = prev;
      intervalId = setInterval(() => {
        current += increment;
        if (current >= next) {
          setDisplayedCoins(next);
          return;
        }
        setDisplayedCoins(Math.floor(current));
      }, step);
      doneId = setTimeout(() => setDisplayedCoins(next), duration);
    }, COINS_STATIC_PAUSE);
    return () => {
      clearTimeout(startId);
      if (intervalId) clearInterval(intervalId);
      if (doneId) clearTimeout(doneId);
    };
  }, [xpRewardData, state]);

  useEffect(() => {
    if (!isOpen || !xpRewardData) return;

    const oldTotalXP = xpRewardData.newTotalXP - xpRewardData.xpBreakdown.totalXP;
    const hasCoins = !!xpRewardData?.coinBreakdown && xpRewardData.previousRCoins != null && xpRewardData.newRCoins != null;
    setState(hasCoins ? { view: 0, phase: "in" } : { view: 1, phase: "in" });
    setXpBarFillPercent(0);
    setDisplayedXP(oldTotalXP);
    setDisplayedTotalXP(0);
    setDisplayedCoins(xpRewardData.previousRCoins ?? xpRewardData.newRCoins ?? 0);
    setParticleSpawn(null);
    setParticlesActive(false);
    setLevelUpTextEntranceDone(false);
    setLevelNumberEntranceDone(false);
    setButtonDim(null);
  }, [isOpen, xpRewardData]);

  useEffect(() => {
    if (!isOpen || !xpRewardData) return;

    const oldTotalXP = xpRewardData.newTotalXP - xpRewardData.xpBreakdown.totalXP;
    const levelBeforeData = calculateLevel(oldTotalXP);
    const levelAfterData = calculateLevel(xpRewardData.newTotalXP);

    if (state.view === 0 && state.phase === "in" && !state.showCoinButton) {
      const t = setTimeout(
        () => setState((s) => (s.view === 0 && s.phase === "in" ? { ...s, showCoinButton: true } : s)),
        COINS_BUTTON_DELAY
      );
      return () => clearTimeout(t);
    }

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

    if (state.view === "transition" && state.from === 0) {
      const t = setTimeout(() => {
        setState({ view: 1, phase: "in" });
      }, TRANSITION_DURATION);
      return () => clearTimeout(t);
    }

    if (state.view === "transition" && state.from === 1) {
      const t = setTimeout(() => {
        setState({ view: 2, phase: "in", breakdownLine: 1, showTotal: false });
      }, TRANSITION_DURATION);
      return () => clearTimeout(t);
    }

    if (state.view === 2 && state.phase === "in") {
      const bl = state.breakdownLine;
      const st = state.showTotal;

      if (bl < 3) {
        const t = setTimeout(
          () => setState((s) => (s.view === 2 && s.phase === "in" ? { ...s, breakdownLine: bl + 1 } : s)),
          bl === 0 ? 0 : STAGE_2_LINE_DELAY
        );
        return () => clearTimeout(t);
      }
      if (!st) {
        const t = setTimeout(() => {
          setState((s) => (s.view === 2 && s.phase === "in" ? { ...s, showTotal: true } : s));
          setDisplayedTotalXP(0);
        }, STAGE_2_TOTAL_DELAY);
        return () => clearTimeout(t);
      }
      const t = setTimeout(
        () => setState({ view: 2, phase: "hold", breakdownLine: 3, showTotal: true }),
        600
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
      }, TRANSITION_DURATION);
      return () => clearTimeout(t);
    }

    if (state.view === 3 && state.phase === "in") {
      const t = setTimeout(() => setState({ view: 3, phase: "bar" }), 500);
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
        if (leveledUp) {
          const rect = barContainerRef.current?.getBoundingClientRect();
          const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
          const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
          setParticleSpawn({ x, y });
          setParticlesActive(true);
          setState({ view: 3, phase: "particles" });
        } else {
          setState({ view: 3, phase: "hold" });
        }
      }, STAGE_3_BAR_DURATION);
      return () => {
        clearTimeout(t);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }

    if (state.view === 3 && state.phase === "particles") {
      return;
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
      const leveledUp = xpRewardData.levelAfter > xpRewardData.levelBefore;
      const t = setTimeout(
        () => setState(leveledUp ? { view: 4, phase: "hold" } : { view: 5 }),
        TRANSITION_DURATION
      );
      return () => clearTimeout(t);
    }

    if (state.view === 4 && state.phase === "hold" && !state.showButton) {
      const t = setTimeout(
        () => setState({ view: 4, phase: "hold", showButton: true }),
        LEVEL_UP_TEXT_DELAY + LEVEL_UP_BUTTON_DELAY
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
    `+${xpBreakdown.participationXP} XP za účasť`,
    `+${xpBreakdown.correctXP} XP za správne odpovede`,
    `+${xpBreakdown.rankXP} XP za #${xpRewardData.rank} umiestnenie`,
  ];

  const currentBreakdown = state.view === 2 ? (state.breakdownLine ?? 0) : 0;
  const currentShowTotal = state.view === 2 ? (state.showTotal ?? false) : false;

  const earnedCoins = (xpRewardData?.newRCoins ?? 0) - (xpRewardData?.previousRCoins ?? 0);

  return (
    <div
      className="fixed inset-0 z-[101] text-[#f3e6c0] flex flex-col items-center justify-center font-['Montserrat']"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "radial-gradient(ellipse at center, #1b2833 0%, #1f3040 100%)",
      }}
    >
      {particlesActive && particleSpawn && (
        <>
          <motion.div
            className="fixed inset-0 z-[103] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.3 }}
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,215,0,0.3) 100%)",
            }}
          />
          <ParticleExplosion
            spawnX={particleSpawn.x}
            spawnY={particleSpawn.y}
            onComplete={() => {
              setParticlesActive(false);
              setParticleSpawn(null);
              setTimeout(() => setState({ view: 3, phase: "out" }), 300);
            }}
          />
        </>
      )}
      <AnimatePresence mode="wait">
        {state.view === 0 && (
          <motion.div
            key="stage0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-6"
          >
            <span className="text-[60px] mb-3" style={{ color: "#FFD700" }}>🪙</span>
            <p className="text-base font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "#FFD700" }}>
              RUPSY COINS
            </p>
            <p
              className="text-[48px] font-bold tabular-nums mb-2"
              style={{ color: "#f3e6c0" }}
            >
              {displayedCoins}
            </p>
            {earnedCoins > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: COINS_STATIC_PAUSE / 1000, duration: 0.5 }}
                className="text-lg font-bold"
                style={{ color: "#FFD700" }}
              >
                +{earnedCoins}
              </motion.p>
            )}
            {state.showCoinButton && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                type="button"
                onClick={() => setState({ view: "transition", from: 0 })}
                className="mt-12 px-12 py-4 rounded-2xl bg-[#f3e6c0] text-[#1b2833] font-bold text-sm uppercase tracking-wider"
              >
                Pokračovať
              </motion.button>
            )}
          </motion.div>
        )}

        {state.view === 1 && (
          <motion.div
            key="stage1"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: state.phase === "out" ? 0 : 1,
              scale: state.phase === "out" ? 0.95 : 1,
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              duration:
                state.phase === "in"
                  ? STAGE_1_FADE_IN / 1000
                  : state.phase === "out"
                    ? STAGE_1_FADE_OUT / 1000
                    : 0.5,
            }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <div className="relative">
              <div
                className="absolute inset-0 -m-24 rounded-full blur-[60px]"
                style={{
                  background: "radial-gradient(circle, #FFD700 0%, transparent 65%)",
                  width: "400%",
                  height: "400%",
                  left: "-150%",
                  top: "-150%",
                  opacity: 0.08,
                }}
              />
              <p className="relative text-3xl font-extrabold uppercase tracking-[0.2em] text-[#FFD700]">
                ZÍSKANÉ ODMENY
              </p>
            </div>
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
            <div className="flex flex-col gap-5 items-center text-center">
              {breakdownLines.slice(0, currentBreakdown).map((line, i) => {
                const match = line.match(/^(\+\d+)(\s+XP.+)$/);
                const numPart = match ? match[1] : line;
                const descPart = match ? match[2] : "";
                return (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-[22px] font-normal text-[#f3e6c0]"
                  >
                    <motion.span
                      className="font-bold text-[#FFD700]"
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 0.3 }}
                    >
                      {numPart}
                    </motion.span>
                    {descPart}
                  </motion.p>
                );
              })}
              {currentShowTotal && (
                <motion.div
                  key="total"
                  className="relative mt-4"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: [0.5, 1.05, 1], opacity: 1 }}
                  transition={{
                    scale: {
                      duration: 0.7,
                      times: [0, 0.7, 1],
                      type: "tween",
                    },
                    opacity: { duration: 0.4 },
                  }}
                >
                  <motion.div
                    className="absolute inset-0 -m-12 rounded-full"
                    style={{
                      background: "radial-gradient(circle, #FFD700 0%, transparent 70%)",
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      width: 400,
                      height: 400,
                    }}
                    initial={{ opacity: 0, scale: 0.25 }}
                    animate={{
                      opacity: [0, 0.15, 0],
                      scale: [0.25, 1, 1],
                    }}
                    transition={{ duration: 0.8 }}
                  />
                  <p
                    className="relative text-[36px] font-bold text-[#FFD700] tabular-nums"
                    style={{ lineHeight: 1.2 }}
                  >
                    CELKOM +{displayedTotalXP} XP
                  </p>
                </motion.div>
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
            transition={{
              duration:
                state.phase === "out" ? STAGE_3_FADE_OUT / 1000 : 0.5,
            }}
            className="absolute inset-0 flex flex-col items-center justify-center px-6"
          >
            <div ref={barContainerRef} className="w-full max-w-[320px]">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#f3e6c0] mb-3">
                LEVEL {levelBefore}
              </p>
              <div
                className="w-full rounded-full overflow-hidden"
                style={{
                  height: 14,
                  background: "#0a0f1a",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.4)",
                }}
              >
                <motion.div
                  className="h-full rounded-full overflow-hidden xp-bar-fill-shimmer"
                  style={{
                    width: `${Math.min(100, Math.max(0, xpBarFillPercent))}%`,
                  }}
                  transition={{ duration: 0.05 }}
                />
              </div>
              <p className="text-sm font-medium text-[#f3e6c0] mt-2 tabular-nums">
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
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <div className="relative z-10 flex flex-col items-center justify-center flex-1">
              <motion.p
                className="font-bold text-[#FFD700] uppercase"
                style={{
                  fontSize: 52,
                  letterSpacing: "0.15em",
                  textShadow: "0 0 30px rgba(255,215,0,0.5), 0 0 60px rgba(255,215,0,0.3)",
                  willChange: "transform",
                }}
                initial={{ scale: 0.3, opacity: 0 }}
                animate={
                  levelUpTextEntranceDone
                    ? { scale: [1, 1.08, 1], opacity: 1 }
                    : { scale: [0.3, 1.1, 1], opacity: 1 }
                }
                transition={
                  levelUpTextEntranceDone
                    ? { scale: { duration: 2, repeat: Infinity, ease: "easeInOut" } }
                    : {
                        scale: {
                          duration: 0.65,
                          times: [0, 0.65, 1],
                          delay: LEVEL_UP_TEXT_DELAY / 1000,
                        },
                        opacity: { duration: 0.3, delay: LEVEL_UP_TEXT_DELAY / 1000 },
                      }
                }
                onAnimationComplete={() => setLevelUpTextEntranceDone(true)}
              >
                LEVEL UP!
              </motion.p>
              <motion.p
                className="my-4 text-[#FFD700] opacity-40"
                style={{ fontSize: 24 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{
                  delay: (LEVEL_UP_TEXT_DELAY + LEVEL_UP_NUMBER_DELAY * 0.5) / 1000,
                  duration: 0.2,
                }}
              >
                ✦
              </motion.p>
              <motion.div
                className="relative"
                style={{ willChange: "transform" }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={
                  levelNumberEntranceDone
                    ? { scale: [1, 1.05, 1], opacity: 1 }
                    : { scale: [0.5, 1.05, 1], opacity: 1 }
                }
                transition={
                  levelNumberEntranceDone
                    ? {
                        scale: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                        opacity: { duration: 0 },
                      }
                    : {
                        duration: 0.6,
                        times: [0, 0.7, 1],
                        delay: (LEVEL_UP_TEXT_DELAY + LEVEL_UP_NUMBER_DELAY) / 1000,
                        type: "tween",
                      }
                }
                onAnimationComplete={() => setLevelNumberEntranceDone(true)}
              >
                <div
                  className="absolute inset-0 -m-16 rounded-full blur-3xl opacity-30"
                  style={{
                    background:
                      "radial-gradient(circle, #FFD700 0%, transparent 70%)",
                    width: 300,
                    height: 300,
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
                <p
                  className="relative font-bold text-[#FFD700]"
                  style={{ fontSize: 120 }}
                >
                  {levelAfter}
                </p>
              </motion.div>
              {state.showButton && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  className="mt-12 relative"
                >
                  <button
                    ref={pokracovatButtonRef}
                    type="button"
                    onClick={closeXPReward}
                    className="relative z-[1] px-12 py-4 rounded-2xl bg-transparent text-[#f3e6c0] font-bold text-sm uppercase tracking-wider hover:bg-[#f3e6c0]/10 transition-colors"
                  >
                    Pokračovať
                  </button>
                  {buttonDim && buttonDim.w > 0 && buttonDim.h > 0 && (
                    <svg
                      className="xp-reward-btn-snake absolute inset-0 w-full h-full pointer-events-none z-[2] overflow-visible"
                      width="100%"
                      height="100%"
                    >
                      <rect
                        x="1"
                        y="1"
                        width={buttonDim.w - 2}
                        height={buttonDim.h - 2}
                        rx={16}
                        ry={16}
                        fill="none"
                        stroke="#f3e6c0"
                        strokeWidth="1.5"
                        strokeOpacity="0.3"
                      />
                      <rect
                        className="xp-reward-btn-snake-animated"
                        x="1"
                        y="1"
                        width={buttonDim.w - 2}
                        height={buttonDim.h - 2}
                        rx={16}
                        ry={16}
                        fill="none"
                        stroke="#FFF8E7"
                        strokeWidth="2"
                        strokeOpacity="0.6"
                        pathLength="100"
                        strokeDasharray="20 80"
                      />
                    </svg>
                  )}
                </motion.div>
              )}
            </div>
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
              className="px-12 py-4 rounded-2xl border border-[#f3e6c0]/40 bg-transparent text-[#f3e6c0] font-bold text-sm uppercase tracking-wider hover:bg-[#f3e6c0]/10 transition-colors"
            >
              Pokračovať
            </button>
          </motion.div>
        )}

        {state.view === "transition" && (
          <div
            key="transition"
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, #1b2833 0%, #1f3040 100%)",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
