"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useSwipeContext } from "@/context/SwipeContext";

const WELCOMED_KEY = "rupsy_welcomed";

export function hasBeenWelcomed(): boolean {
  if (typeof window === "undefined") return true;
  return !!localStorage.getItem(WELCOMED_KEY);
}

export function setWelcomed(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(WELCOMED_KEY, "1");
  }
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function WelcomeModal({ isOpen, onClose }: Props) {
  const { setSwipeDisabled } = useSwipeContext();

  useEffect(() => {
    if (isOpen) {
      setSwipeDisabled(true);
      return () => setSwipeDisabled(false);
    }
  }, [isOpen, setSwipeDisabled]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed inset-0 z-[200] flex items-center justify-center px-6"
      style={{
        background: "rgba(0,0,0,0.5)",
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
        className="w-full max-w-[360px] rounded-3xl p-8 flex flex-col items-center text-center"
        style={{
          background: "radial-gradient(ellipse at center, #1b2833 0%, #1f3040 100%)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <p className="text-2xl font-bold text-[#FFD700] tracking-tight mb-2">
          Vitaj v RUPSY Kvíze!
        </p>
        <p className="text-base text-[#f3e6c0] mb-6">
          Ako darček na štart ti dávame
        </p>
        <motion.div
          className="flex items-center gap-2 mb-1"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: [0.5, 1.05, 1] }}
          transition={{
            opacity: { duration: 0.4, delay: 1.1 },
            scale: { duration: 0.5, delay: 1.1, times: [0, 0.7, 1], ease: "easeOut" },
          }}
        >
          <span className="text-4xl font-bold text-[#FFD700] tabular-nums">25</span>
          <span
            className="w-10 h-10 rounded-full bg-[#1b2833] text-[#f3e6c0] text-base font-bold flex items-center justify-center flex-shrink-0"
            style={{ border: "2px solid #f3e6c0" }}
          >
            R
          </span>
        </motion.div>
        <p className="text-sm text-[#f3e6c0] mb-8">RUPSY COINOV</p>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.4 }}
          type="button"
          onClick={() => {
            setWelcomed();
            onClose();
          }}
          className="w-full py-4 rounded-2xl font-bold text-base uppercase tracking-wider"
          style={{
            background: "#FFD700",
            color: "#1b2833",
          }}
        >
          VYZDVIHNÚŤ ODMENU
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
