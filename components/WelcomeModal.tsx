"use client";

import { motion } from "framer-motion";

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
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center px-6"
      style={{
        background: "rgba(0,0,0,0.5)",
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
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
        <div className="flex items-center gap-2 mb-1">
          <span className="text-4xl font-bold text-[#FFD700] tabular-nums">25</span>
          <span
            className="w-10 h-10 rounded-full bg-[#1b2833] text-[#f3e6c0] text-base font-bold flex items-center justify-center flex-shrink-0"
            style={{ border: "2px solid #f3e6c0" }}
          >
            R
          </span>
        </div>
        <p className="text-sm text-[#f3e6c0] mb-8">RUPSY COINOV</p>
        <button
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
        </button>
      </motion.div>
    </motion.div>
  );
}
