"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeContext } from "@/context/SwipeContext";
import { useXPReward } from "@/context/XPRewardContext";
import { calculateLevel } from "@/lib/xp";

const STAGE_1_DURATION = 1500;
const STAGE_2_LINE_DELAY = 800;
const STAGE_2_TOTAL_DELAY = 400;
const STAGE_3_DURATION = 2000;
const STAGE_4_DURATION = 2000;

export default function XPRewardModal() {
  const { xpRewardData, closeXPReward, isOpen } = useXPReward();
  const { setSwipeDisabled } = useSwipeContext();
  const [stage, setStage] = useState(1);
  const [breakdownLine, setBreakdownLine] = useState(0);
  const [showTotal, setShowTotal] = useState(false);
  const [xpBarProgress, setXpBarProgress] = useState(0);
  const [displayedXP, setDisplayedXP] = useState(0);
  const levelUpShownRef = useRef(false);

  useEffect(() => {
    setSwipeDisabled(isOpen);
    return () => setSwipeDisabled(false);
  }, [isOpen, setSwipeDisabled]);

  useEffect(() => {
    if (!isOpen || !xpRewardData) return;

    setStage(1);
    setBreakdownLine(0);
    setShowTotal(false);
    setXpBarProgress(0);
    setDisplayedXP(xpRewardData.newTotalXP - xpRewardData.xpBreakdown.totalXP);
    levelUpShownRef.current = false;
  }, [isOpen, xpRewardData]);

  useEffect(() => {
    if (!isOpen || !xpRewardData) return;

    if (stage === 1) {
      const t = setTimeout(() => setStage(2), STAGE_1_DURATION);
      return () => clearTimeout(t);
    }

    if (stage === 2) {
      const { xpBreakdown } = xpRewardData;
      const lines = [
        { label: "+30 XP za účasť", value: xpBreakdown.participationXP },
        {
          label: "+X XP za správne odpovede",
          value: xpBreakdown.correctXP,
          substitute: xpBreakdown.correctXP,
        },
        {
          label: "+X XP za #Y umiestnenie",
          value: xpBreakdown.rankXP,
          substitute: xpBreakdown.rankXP,
        },
      ];

      if (breakdownLine < lines.length) {
        const t = setTimeout(() => setBreakdownLine((p) => p + 1), STAGE_2_LINE_DELAY);
        return () => clearTimeout(t);
      }

      if (!showTotal) {
        const t = setTimeout(() => setShowTotal(true), STAGE_2_TOTAL_DELAY);
        return () => clearTimeout(t);
      }

      const t = setTimeout(() => setStage(3), 600);
      return () => clearTimeout(t);
    }

    if (stage === 3) {
      const oldTotalXP = xpRewardData.newTotalXP - xpRewardData.xpBreakdown.totalXP;
      const levelBeforeData = calculateLevel(oldTotalXP);
      const levelAfterData = calculateLevel(xpRewardData.newTotalXP);
      const startPercent = levelBeforeData.progressPercent;
      const endPercent = levelAfterData.progressPercent;

      const startTime = Date.now();
      const raf = () => {
        const elapsed = Date.now() - startTime;
        const p = Math.min(1, elapsed / STAGE_3_DURATION);
        const eased = 1 - (1 - p) * (1 - p);
        setXpBarProgress(startPercent + (endPercent - startPercent) * eased);
        setDisplayedXP(
          Math.round(oldTotalXP + (xpRewardData.newTotalXP - oldTotalXP) * eased)
        );
        if (p < 1) requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);

      const t = setTimeout(() => {
        setXpBarProgress(endPercent);
        setDisplayedXP(xpRewardData.newTotalXP);
        if (xpRewardData.levelAfter > xpRewardData.levelBefore) {
          levelUpShownRef.current = true;
          setStage(4);
        } else {
          setStage(5);
        }
      }, STAGE_3_DURATION);
      return () => clearTimeout(t);
    }

    if (stage === 4) {
      const t = setTimeout(() => setStage(5), STAGE_4_DURATION);
      return () => clearTimeout(t);
    }
  }, [isOpen, xpRewardData, stage, breakdownLine, showTotal]);

  if (!isOpen || !xpRewardData) return null;

  const { xpBreakdown, levelBefore, levelAfter, newTotalXP } = xpRewardData;
  const oldTotalXP = newTotalXP - xpBreakdown.totalXP;
  const levelAfterData = calculateLevel(newTotalXP);
  const leveledUp = levelAfter > levelBefore;

  const breakdownLines = [
    { label: "+30 XP za účasť", value: xpBreakdown.participationXP },
    {
      label: `+${xpBreakdown.correctXP} XP za správne odpovede`,
      value: xpBreakdown.correctXP,
    },
    {
      label: `+${xpBreakdown.rankXP} XP za #${xpRewardData.rank} umiestnenie`,
      value: xpBreakdown.rankXP,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[101] bg-[#1b2833] text-[#f3e6c0] flex flex-col items-center justify-center font-['Montserrat']"
      style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh" }}
    >
      <div className="w-full max-w-[480px] mx-auto px-6 flex flex-col items-center text-center">
        {stage === 1 && (
          <motion.p
            key="stage1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-3xl font-extrabold uppercase tracking-[0.2em]"
          >
            KVÍZ DOKONČENÝ
          </motion.p>
        )}

        {stage === 2 && (
          <motion.div
            key="stage2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-3"
          >
            {breakdownLines.slice(0, breakdownLine).map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-semibold"
              >
                {line.label}
              </motion.p>
            ))}
            {showTotal && (
              <motion.p
                key="total"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="text-2xl font-extrabold mt-4 text-[#FFD700]"
              >
                CELKOM +{xpBreakdown.totalXP} XP
              </motion.p>
            )}
          </motion.div>
        )}

        {(stage === 3 || stage === 4 || stage === 5) && (
          <motion.div
            key="stage3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-[280px]"
          >
            <p className="text-sm font-bold uppercase tracking-widest opacity-70 mb-2">
              LEVEL {stage === 3 ? levelBefore : levelAfter}
            </p>
            <div className="w-full h-3 bg-[#1b2833]/50 rounded-full overflow-hidden border border-[#f3e6c0]/20">
              <motion.div
                className="h-full bg-[#f3e6c0] rounded-full"
                style={{ width: `${xpBarProgress}%` }}
                transition={{ duration: stage === 3 ? 0 : 0.3 }}
              />
            </div>
            <p className="text-xs font-medium opacity-60 mt-2 tabular-nums">
              {levelAfterData.xpForNextLevel != null
                ? `${displayedXP} / ${levelAfterData.xpForNextLevel} XP`
                : `${displayedXP} XP (MAX)`}
            </p>
          </motion.div>
        )}

        {stage === 4 && leveledUp && (
          <motion.div
            key="levelup"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              boxShadow: [
                "0 0 20px rgba(255,215,0,0.3)",
                "0 0 40px rgba(255,215,0,0.5)",
                "0 0 20px rgba(255,215,0,0.3)",
              ],
            }}
            transition={{
              scale: { type: "spring", stiffness: 200 },
              boxShadow: { duration: 1, repeat: Infinity },
            }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          >
            <p className="text-4xl font-extrabold text-[#FFD700] uppercase tracking-wider">
              LEVEL UP!
            </p>
            <p className="text-6xl font-black mt-4 text-[#f3e6c0]">{levelAfter}</p>
          </motion.div>
        )}

        {stage === 5 && (
          <motion.div
            key="stage5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8"
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
      </div>
    </div>
  );
}
