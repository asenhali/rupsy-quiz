"use client";

import { useRef, useEffect, useState } from "react";
import { getCosmeticById, DEFAULT_ITEM_IDS, getNameColorValue, type CosmeticItem, type NameColorVariant } from "@/lib/cosmetics";

type Props = {
  equippedNameColorId: string | null;
  variant: NameColorVariant;
  children: React.ReactNode;
  className?: string;
};

export default function NameColorText({
  equippedNameColorId,
  variant,
  children,
  className = "",
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const item = getCosmeticById(
    equippedNameColorId ?? DEFAULT_ITEM_IDS.nameColor
  );
  const colorValue = getNameColorValue(item, variant);
  const isGradient = colorValue.startsWith("linear-gradient");
  const anim = item?.animation;

  useEffect(() => {
    if (!anim || !ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry?.isIntersecting ?? true),
      { rootMargin: "50px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [anim]);

  const baseStyle: React.CSSProperties = isGradient
    ? {
        background: colorValue,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }
    : { color: colorValue };

  const animClass = anim ? `nc-anim-${anim}` : "";
  const pauseClass = anim && !isVisible ? "nc-anim-paused" : "";

  return (
    <span
      ref={ref}
      className={`${animClass} ${pauseClass} ${className}`.trim()}
      style={baseStyle}
    >
      {children}
    </span>
  );
}
