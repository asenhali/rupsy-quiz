"use client";

import { getCharacterSrc } from "@/lib/characters";

/** Proportional border: 3px at 130px baseline, scales down for smaller avatars. Color #C0C0C0 */
function getBorderWidthPx(sizePx: number): number {
  if (sizePx >= 96) return 3;
  if (sizePx >= 64) return 2.5;
  return 2;
}

const AVATAR_BORDER_COLOR = "#C0C0C0";

type Props = {
  characterId: string;
  sizePx: number;
  alt?: string;
  className?: string;
};

export default function Avatar({
  characterId,
  sizePx,
  alt = "",
  className = "",
}: Props) {
  const borderWidth = getBorderWidthPx(sizePx);
  const src = getCharacterSrc(characterId);

  return (
    <img
      src={src}
      alt={alt}
      className={`rounded-full object-cover shrink-0 ${className}`}
      style={{
        width: sizePx,
        height: sizePx,
        border: `${borderWidth}px solid ${AVATAR_BORDER_COLOR}`,
        boxSizing: "border-box",
      }}
      onError={(e) => {
        (e.target as HTMLImageElement).src = getCharacterSrc("rupsik");
      }}
    />
  );
}
