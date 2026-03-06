"use client";

import { useEffect, useRef, useState } from "react";
import { getCosmeticById, DEFAULT_ITEM_IDS, getNameColorValue } from "@/lib/cosmetics";

interface NameColorTextProps {
  children: React.ReactNode;
  /** When provided, looks up cosmetic and derives dark, light, animated, animation */
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
  const [isVisible, setIsVisible] = useState(false);

  // Resolve from equippedNameColorId when provided
  const item = equippedNameColorId != null
    ? getCosmeticById(equippedNameColorId || DEFAULT_ITEM_IDS.nameColor)
    : null;
  const dark = item ? (item.dark ?? item.value ?? darkProp) : darkProp;
  const light = item ? (item.light ?? item.value ?? lightProp) : lightProp;
  const animated = item ? (item.animated ?? animatedProp) : animatedProp;
  const animation = item ? (item.animation ?? animationProp) : animationProp;

  // IntersectionObserver — only animate when visible
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

  // Base styles for all text
  const baseStyle: React.CSSProperties = {
    fontWeight: "bold",
    display: "inline-block",
    willChange: animated ? "transform, opacity" : "auto",
    ...style,
  };

  // NON-ANIMATED: solid color or gradient (static)
  if (!animated || !isVisible) {
    if (isGradient) {
      return (
        <span
          ref={ref}
          className={className}
          style={{
            ...baseStyle,
            background: colorValue,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {children}
        </span>
      );
    }
    return (
      <span ref={ref} className={className} style={{ ...baseStyle, color: colorValue }}>
        {children}
      </span>
    );
  }

  // ANIMATED text — each animation type gets its own treatment
  const animClass = `nc-anim-${animation}`;

  switch (animation) {
    // ═══════════════════════════════════════════════
    // PULSE — breathing opacity effect
    // ═══════════════════════════════════════════════
    case "pulse":
      return (
        <span
          ref={ref}
          className={`${className} ${animClass}`}
          style={{
            ...baseStyle,
            ...(isGradient
              ? {
                  background: colorValue,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }
              : { color: colorValue }),
          }}
        >
          {children}
        </span>
      );

    // ═══════════════════════════════════════════════
    // SHIMMER — light sweep across text
    // ═══════════════════════════════════════════════
    case "shimmer": {
      const baseColor = variant === "dark" ? dark : light;
      const shimmerGradient = isGradient
        ? colorValue.replace(/\)\s*$/, ", rgba(255,255,255,0.8) 45%, rgba(255,255,255,0.8) 55%)")
        : `linear-gradient(90deg, ${baseColor} 0%, ${baseColor} 35%, rgba(255,255,255,0.95) 48%, rgba(255,255,255,0.95) 52%, ${baseColor} 65%, ${baseColor} 100%)`;
      return (
        <span
          ref={ref}
          className={`${className} ${animClass}`}
          style={{
            ...baseStyle,
            background: shimmerGradient,
            backgroundSize: "250% 100%",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {children}
        </span>
      );
    }

    // ═══════════════════════════════════════════════
    // FLOW — gradient slowly moves through text
    // ═══════════════════════════════════════════════
    case "flow": {
      const flowGradient = isGradient ? colorValue : `linear-gradient(90deg, ${dark}, ${light}, ${dark})`;
      return (
        <span
          ref={ref}
          className={`${className} ${animClass}`}
          style={{
            ...baseStyle,
            background: flowGradient,
            backgroundSize: "300% 100%",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {children}
        </span>
      );
    }

    // ═══════════════════════════════════════════════
    // RAINBOW — hue rotation (full spectrum cycling)
    // ═══════════════════════════════════════════════
    case "rainbow": {
      return (
        <span
          ref={ref}
          className={`${className} ${animClass}`}
          style={{
            ...baseStyle,
            background: colorValue.includes("gradient")
              ? colorValue
              : "linear-gradient(90deg, #FF0000, #FF8800, #FFFF00, #00FF00, #0088FF, #8800FF, #FF0000)",
            backgroundSize: "300% 100%",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {children}
        </span>
      );
    }

    // ═══════════════════════════════════════════════
    // SPARKLE — gold/diamond shimmer with bright flashes
    // ═══════════════════════════════════════════════
    case "sparkle": {
      const sparkleBase = variant === "dark" ? dark : light;
      const highlightColor = "#FFFFFF";
      const sparkleGradient = isGradient
        ? colorValue
        : `linear-gradient(90deg, ${sparkleBase} 0%, ${sparkleBase} 25%, ${highlightColor} 37%, ${sparkleBase} 50%, ${sparkleBase} 75%, ${highlightColor} 87%, ${sparkleBase} 100%)`;
      /* For gradient items (e.g. Diamantová), use as-is; for solid (e.g. Zlatá), use built gradient */
      return (
        <span
          ref={ref}
          className={`${className} ${animClass}`}
          style={{
            ...baseStyle,
            background: sparkleGradient,
            backgroundSize: "400% 100%",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {children}
        </span>
      );
    }

    // ═══════════════════════════════════════════════
    // FLASH — brightness pulse (like electrical)
    // ═══════════════════════════════════════════════
    case "flash": {
      const flashGradient = isGradient ? colorValue : `linear-gradient(90deg, ${dark}, ${light})`;
      return (
        <span
          ref={ref}
          className={`${className} ${animClass}`}
          style={{
            ...baseStyle,
            background: flashGradient,
            backgroundSize: "200% 100%",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {children}
        </span>
      );
    }

    // ═══════════════════════════════════════════════
    // GLOW — neon sign flicker effect
    // ═══════════════════════════════════════════════
    case "glow": {
      return (
        <span
          ref={ref}
          className={`${className} ${animClass}`}
          style={{
            ...baseStyle,
            color: colorValue,
            textShadow: `0 0 7px ${colorValue}, 0 0 14px ${colorValue}, 0 0 21px ${colorValue}`,
          }}
        >
          {children}
        </span>
      );
    }

    // ═══════════════════════════════════════════════
    // GLITCH — digital distortion with color shifts (3 layered spans)
    // ═══════════════════════════════════════════════
    case "glitch": {
      return (
        <span
          ref={ref}
          className={`${className} nc-glitch-wrapper`}
          style={{ ...baseStyle, position: "relative", display: "inline-block" }}
        >
          <span className="nc-glitch-main" style={{ color: colorValue }}>
            {children}
          </span>
          <span
            className="nc-glitch-layer1"
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              color: "#00FFFF",
              opacity: 0.7,
              clipPath: "inset(0 0 65% 0)",
              pointerEvents: "none",
            }}
          >
            {children}
          </span>
          <span
            className="nc-glitch-layer2"
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              color: "#FF00FF",
              opacity: 0.7,
              clipPath: "inset(65% 0 0 0)",
              pointerEvents: "none",
            }}
          >
            {children}
          </span>
        </span>
      );
    }

    // ═══════════════════════════════════════════════
    // VOID — dark mysterious breathing with edge glow
    // ═══════════════════════════════════════════════
    case "void": {
      return (
        <span
          ref={ref}
          className={`${className} ${animClass}`}
          style={{
            ...baseStyle,
            color: "#1a1a2e",
            textShadow: `0 0 4px #8B0000, 0 0 8px #4a0033, 0 0 20px rgba(139,0,0,0.3)`,
          }}
        >
          {children}
        </span>
      );
    }

    // ═══════════════════════════════════════════════
    // DEFAULT fallback — solid or gradient, no animation
    // ═══════════════════════════════════════════════
    default:
      if (isGradient) {
        return (
          <span
            ref={ref}
            className={className}
            style={{
              ...baseStyle,
              background: colorValue,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {children}
          </span>
        );
      }
      return (
        <span ref={ref} className={className} style={{ ...baseStyle, color: colorValue }}>
          {children}
        </span>
      );
  }
}
