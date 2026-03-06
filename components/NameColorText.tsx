"use client";

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
  const item = getCosmeticById(
    equippedNameColorId ?? DEFAULT_ITEM_IDS.nameColor
  );
  const colorValue = getNameColorValue(item, variant);
  const isGradient = colorValue.startsWith("linear-gradient");
  const anim = item?.animation;

  const baseStyle: React.CSSProperties = isGradient
    ? {
        background: colorValue,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }
    : { color: colorValue };

  const animClass = anim ? `nc-anim-${anim}` : "";

  return (
    <span
      className={`${animClass} ${className}`.trim()}
      style={baseStyle}
    >
      {children}
    </span>
  );
}
