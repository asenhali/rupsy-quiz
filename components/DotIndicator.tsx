"use client";

import { motion } from "framer-motion";

interface DotIndicatorProps {
  count: number;
  activeIndex: number;
  onDotClick?: (index: number) => void;
}

export default function DotIndicator({
  count,
  activeIndex,
  onDotClick,
}: DotIndicatorProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-50">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          onClick={() => onDotClick?.(i)}
          className="relative w-2 h-2 rounded-full bg-[#1b2833]/30"
          aria-label={`Go to panel ${i + 1}`}
        >
          {i === activeIndex && (
            <motion.div
              layoutId="dot-active"
              className="absolute inset-0 rounded-full bg-[#1b2833]"
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
