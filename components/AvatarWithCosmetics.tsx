"use client";

import { getCharacterSrc } from "@/lib/characters";
import { getCosmeticById, DEFAULT_ITEM_IDS } from "@/lib/cosmetics";

const DEFAULT_BG = "#D3D3D3";
const DEFAULT_FRAME = "#C0C0C0";

type Props = {
  characterId: string;
  sizePx: number;
  equippedAvatarBackground?: string | null;
  equippedAvatarFrame?: string | null;
  alt?: string;
  className?: string;
};

/** Proportional border and inner size; leaves ~7% for pozadie ring */
function getDimensions(sizePx: number) {
  const borderWidth = sizePx >= 96 ? 3 : sizePx >= 64 ? 2.5 : 2;
  const innerTotal = Math.floor(sizePx * 0.86);
  const innerSize = innerTotal - borderWidth * 2;
  return { borderWidth, innerSize: Math.max(innerSize, 20) };
}

export default function AvatarWithCosmetics({
  characterId,
  sizePx,
  equippedAvatarBackground,
  equippedAvatarFrame,
  alt = "",
  className = "",
}: Props) {
  const bgItem = equippedAvatarBackground
    ? getCosmeticById(equippedAvatarBackground)
    : getCosmeticById(DEFAULT_ITEM_IDS.avatarBackground);
  const frameItem = equippedAvatarFrame
    ? getCosmeticById(equippedAvatarFrame)
    : getCosmeticById(DEFAULT_ITEM_IDS.avatarFrame);

  const bgStyle = bgItem?.value ?? DEFAULT_BG;
  const isRainbowFrame = frameItem?.value === "rainbow";
  const frameStyle = frameItem?.value ?? DEFAULT_FRAME;

  const { borderWidth, innerSize } = getDimensions(sizePx);

  return (
    <div
      className={`rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center ${className}`}
      style={{
        width: sizePx,
        height: sizePx,
        background: bgStyle,
      }}
    >
      {isRainbowFrame ? (
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: innerSize + borderWidth * 2,
            height: innerSize + borderWidth * 2,
            padding: `${borderWidth}px`,
            background:
              "linear-gradient(90deg, #FF0000, #FF8800, #FFFF00, #00FF00, #0088FF, #8800FF)",
          }}
        >
          <img
            src={getCharacterSrc(characterId)}
            alt={alt}
            className="rounded-full object-cover"
            style={{ width: innerSize, height: innerSize }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = getCharacterSrc("rupsik");
            }}
          />
        </div>
      ) : (
        <img
          src={getCharacterSrc(characterId)}
          alt={alt}
          className="rounded-full object-cover"
          style={{
            width: innerSize,
            height: innerSize,
            border: `${borderWidth}px solid ${frameStyle}`,
            boxSizing: "border-box",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = getCharacterSrc("rupsik");
          }}
        />
      )}
    </div>
  );
}
