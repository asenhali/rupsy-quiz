"use client";

import { useEffect, useRef, useState } from "react";
import { getCosmeticById, DEFAULT_ITEM_IDS } from "@/lib/cosmetics";

interface NameColorTextProps {
  children: React.ReactNode;
  equippedNameColorId?: string | null;
  dark?: string;
  light?: string;
  animated?: boolean;
  animation?: string;
  variant?: "dark" | "light";
  className?: string;
  style?: React.CSSProperties;
}

export default function NameColorText({
  children,
  equippedNameColorId,
  dark: darkProp = "#1b2833",
  light: lightProp = "#f3e6c0",
  animated: animatedProp = false,
  animation: animationProp = "",
  variant = "dark",
  className = "",
  style = {},
}: NameColorTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  const item =
    equippedNameColorId != null
      ? getCosmeticById(equippedNameColorId || DEFAULT_ITEM_IDS.nameColor)
      : null;
  const dark = item ? (item.dark ?? item.value ?? darkProp) : darkProp;
  const light = item ? (item.light ?? item.value ?? lightProp) : lightProp;
  const animated = item ? (item.animated ?? animatedProp) : animatedProp;
  const animation = item ? (item.animation ?? animationProp) : animationProp;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const colorValue = variant === "dark" ? dark : light;
  const isGradient = colorValue.includes("gradient");
  const shouldAnimate = animated && isVisible;
  const animClass = shouldAnimate ? `nc-anim-${animation}` : "";

  // ── GLITCH: 3 layered spans ──
  if (shouldAnimate && animation === "glitch") {
    return (
      <span ref={ref} className={className} style={{ position: "relative", display: "inline-block", fontWeight: "bold", ...style }}>
        <span className="nc-glitch-main" style={{ color: colorValue }}>{children}</span>
        <span className="nc-glitch-layer1" aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, color: "#00FFFF", opacity: 0.7, clipPath: "inset(0 0 65% 0)", pointerEvents: "none" }}>{children}</span>
        <span className="nc-glitch-layer2" aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, color: "#FF00FF", opacity: 0.7, clipPath: "inset(65% 0 0 0)", pointerEvents: "none" }}>{children}</span>
      </span>
    );
  }

  // ── GLOW: solid color + neon text-shadow ──
  if (shouldAnimate && animation === "glow") {
    return (
      <span ref={ref} className={`${className} ${animClass}`} style={{ fontWeight: "bold", color: colorValue, textShadow: `0 0 7px ${colorValue}, 0 0 14px ${colorValue}, 0 0 21px ${colorValue}`, display: "inline-block", ...style }}>
        {children}
      </span>
    );
  }

  // ── VOID: dark + red glow ──
  if (shouldAnimate && animation === "void") {
    return (
      <span ref={ref} className={`${className} ${animClass}`} style={{ fontWeight: "bold", color: "#1a1a2e", textShadow: "0 0 4px #8B0000, 0 0 8px #4a0033, 0 0 20px rgba(139,0,0,0.3)", display: "inline-block", ...style }}>
        {children}
      </span>
    );
  }

  // ── SOLID color, no animation ──
  if (!isGradient && !shouldAnimate) {
    return (
      <span ref={ref} className={className} style={{ fontWeight: "bold", color: colorValue, ...style }}>
        {children}
      </span>
    );
  }

  // ── SOLID color + pulse ──
  if (!isGradient && shouldAnimate && animation === "pulse") {
    return (
      <span ref={ref} className={`${className} nc-anim-pulse`} style={{ fontWeight: "bold", color: colorValue, display: "inline-block", ...style }}>
        {children}
      </span>
    );
  }

  // ── ALL GRADIENT TEXT (static or animated) ──
  let gradient = colorValue;
  let bgSize = "100% 100%";

  if (shouldAnimate) {
    switch (animation) {
      case "shimmer": {
        const base = variant === "dark" ? dark : light;
        gradient = isGradient ? colorValue : `linear-gradient(90deg, ${base} 0%, ${base} 35%, rgba(255,255,255,0.95) 48%, rgba(255,255,255,0.95) 52%, ${base} 65%, ${base} 100%)`;
        bgSize = "250% 100%";
        break;
      }
      case "flow": {
        gradient = isGradient ? colorValue : `linear-gradient(90deg, ${dark}, ${light}, ${dark})`;
        bgSize = "300% 100%";
        break;
      }
      case "rainbow": {
        gradient = isGradient ? colorValue : "linear-gradient(90deg, #FF0000, #FF8800, #FFFF00, #00FF00, #0088FF, #8800FF, #FF0000)";
        bgSize = "300% 100%";
        break;
      }
      case "sparkle": {
        const base = variant === "dark" ? dark : light;
        gradient = isGradient ? colorValue : `linear-gradient(90deg, ${base} 0%, ${base} 25%, #FFFFFF 37%, ${base} 50%, ${base} 75%, #FFFFFF 87%, ${base} 100%)`;
        bgSize = "400% 100%";
        break;
      }
      case "flash": {
        gradient = isGradient ? colorValue : `linear-gradient(90deg, ${dark}, ${light})`;
        bgSize = "200% 100%";
        break;
      }
      case "pulse": {
        bgSize = "100% 100%";
        break;
      }
      default:
        break;
    }
  }

  // KEY FIX: Use CSS class "nc-gradient-text" which forces background-clip: text !important
  // This prevents Tailwind from overriding it with background-clip: border-box
  return (
    <span ref={ref} className={className} style={style}>
      <span
        className={`nc-gradient-text ${animClass}`}
        style={{ backgroundImage: gradient, backgroundSize: bgSize }}
      >
        {children}
      </span>
    </span>
  );
}
