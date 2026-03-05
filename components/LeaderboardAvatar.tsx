"use client";

import { getCharacterSrc } from "@/lib/characters";
import { getCosmeticById, DEFAULT_ITEM_IDS } from "@/lib/cosmetics";

const SIZE = 34;
const DEFAULT_BG = "#D3D3D3";
const DEFAULT_FRAME = "#C0C0C0";

type Props = {
  equippedAvatar: string;
  equippedAvatarBackground: string | null;
  equippedAvatarFrame: string | null;
};

export default function LeaderboardAvatar({
  equippedAvatar,
  equippedAvatarBackground,
  equippedAvatarFrame,
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

  return (
    <div
      className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
      style={{
        width: SIZE,
        height: SIZE,
        background: bgStyle,
      }}
    >
      {isRainbowFrame ? (
        <div
          className="rounded-full p-[2px] w-[28px] h-[28px]"
          style={{
            background:
              "linear-gradient(90deg, #FF0000, #FF8800, #FFFF00, #00FF00, #0088FF, #8800FF)",
          }}
        >
          <img
            src={getCharacterSrc(equippedAvatar)}
            alt=""
            className="w-full h-full rounded-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = getCharacterSrc("rupsik");
            }}
          />
        </div>
      ) : (
        <img
          src={getCharacterSrc(equippedAvatar)}
          alt=""
          className="rounded-full object-cover w-[28px] h-[28px]"
          style={{
            border: `2px solid ${frameStyle}`,
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
