"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { getCosmeticById, DEFAULT_ITEM_IDS } from "@/lib/cosmetics";
import PixiTextEffect from "./PixiTextEffect";

function PixiFireWrapper({ text, parentRef, styleFontSize, effect = "fire" }: { text: string; parentRef: RefObject<HTMLSpanElement | null>; styleFontSize?: string | number; effect?: string }) {
  const [size, setSize] = useState<number | null>(() => {
    if (styleFontSize) return parseInt(String(styleFontSize), 10);
    return null;
  });

  useEffect(() => {
    if (styleFontSize) {
      setSize(parseInt(String(styleFontSize), 10)); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    const el = parentRef.current;
    if (!el) return;
    const computed = parseFloat(getComputedStyle(el).fontSize);
    if (computed > 0) setSize(Math.round(computed)); // eslint-disable-line react-hooks/set-state-in-effect
  }, [parentRef, styleFontSize]);

  // Don't render until we have the real font size
  if (size === null) return null;

  return <PixiTextEffect text={text} effect={effect} fontSize={size} />;
}

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

  // ── PIXI EFFECTS: fire, lightning ──
  if (shouldAnimate && (animation === "fire" || animation === "lightning")) {
    const textContent = typeof children === "string" ? children : String(children ?? "");
    return (
      <span ref={ref} className={className} style={style}>
        <PixiFireWrapper text={textContent} parentRef={ref} styleFontSize={style?.fontSize} effect={animation} />
      </span>
    );
  }

  // ── GLITCH: 3 layered spans with RGB channel separation ──
  if (shouldAnimate && animation === "glitch") {
    return (
      <span ref={ref} className={className} style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", display: "inline-block", maxWidth: "100%", ...style }}>
        <span style={{ position: "relative", display: "inline-block", fontWeight: "bold", overflow: "visible", padding: "4px 6px" }}>
          <span className="nc-glitch-main" style={{ color: "#FFFFFF" }}>{children}</span>
          <span className="nc-glitch-layer1" aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, color: "rgba(255,0,60,0.75)", clipPath: "inset(0 0 65% 0)", pointerEvents: "none", transform: "translate(-1.5px, 0)", padding: "4px 6px" }}>{children}</span>
          <span className="nc-glitch-layer2" aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, color: "rgba(0,60,255,0.75)", clipPath: "inset(65% 0 0 0)", pointerEvents: "none", transform: "translate(1.5px, 0)", padding: "4px 6px" }}>{children}</span>
        </span>
      </span>
    );
  }

  // ── GLOW: animated text-shadow spread + letter-spacing ──
  if (shouldAnimate && animation === "glow") {
    return (
      <span ref={ref} className={className} style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", display: "inline-block", maxWidth: "100%", ...style }}>
        <span className={`${animClass}`} style={{ fontWeight: "bold", color: colorValue, textShadow: `0 0 3px ${colorValue}, 0 0 8px ${colorValue}`, display: "inline-block", overflow: "visible", padding: "4px 0" }}>
          {children}
        </span>
      </span>
    );
  }

  // ── VOID: black hole breathing with animated shadow ──
  if (shouldAnimate && animation === "void") {
    return (
      <span ref={ref} className={className} style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", display: "inline-block", maxWidth: "100%", ...style }}>
        <span className={`${animClass}`} style={{ fontWeight: "bold", color: "#1a1a2e", textShadow: "0 0 4px #8B0000, 0 0 8px #4a0033, 0 0 15px rgba(139,0,0,0.3)", display: "inline-block", overflow: "visible", padding: "4px 0" }}>
          {children}
        </span>
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
        gradient = isGradient ? colorValue : `linear-gradient(120deg, ${base} 0%, ${base} 40%, rgba(255,255,255,0.98) 49%, rgba(255,255,255,0.98) 51%, ${base} 60%, ${base} 100%)`;
        bgSize = "250% 250%";
        break;
      }
      case "flow": {
        gradient = isGradient ? colorValue : `linear-gradient(90deg, ${dark}, ${light}, ${dark})`;
        bgSize = "500% 100%";
        break;
      }
      case "rainbow": {
        gradient = isGradient ? colorValue : "linear-gradient(90deg, #FF0000, #FF8800, #FFFF00, #00FF00, #0088FF, #8800FF, #FF0000)";
        bgSize = "100% 100%";
        break;
      }
      case "sparkle": {
        const base = variant === "dark" ? dark : light;
        gradient = isGradient ? colorValue : `linear-gradient(120deg, ${base} 0%, ${base} 25%, #FFFFFF 37%, ${base} 50%, ${base} 75%, #FFFFFF 87%, ${base} 100%)`;
        bgSize = "400% 400%";
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

  // Flash uses transform (jitter) so needs inline-block
  const needsInlineBlock = shouldAnimate && (animation === "flash" || animation === "pulse");

  return (
    <span ref={ref} className={className} style={style}>
      <span
        className={`nc-gradient-text ${animClass}`}
        style={{ backgroundImage: gradient, backgroundSize: bgSize, ...(needsInlineBlock ? { display: "inline-block" } : {}) }}
      >
        {children}
      </span>
    </span>
  );
}
