"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfileModal } from "@/context/ProfileModalContext";
import {
  getCosmeticById,
  getCosmeticsByType,
  getAvatarItemIdByValue,
  DEFAULT_ITEM_IDS,
  TIER_BORDER_COLORS,
  type CosmeticItem,
  type CosmeticType,
} from "@/lib/cosmetics";
import { getCharacterSrc } from "@/lib/characters";

const TAB_LABELS: Record<CosmeticType, string> = {
  nameColor: "FARBA MENA",
  avatar: "POSTAVIČKA",
  avatarBackground: "POZADIE",
  avatarFrame: "RÁMIK",
};

export default function VybavaPanel() {
  const router = useRouter();
  const { user, setUser } = useProfileModal();
  const [activeTab, setActiveTab] = useState<CosmeticType>("nameColor");
  const [loading, setLoading] = useState(true);
  const [equipping, setEquipping] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/me", { credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        router.replace("/");
        return;
      }
      setUser(json.user ?? null);
      setLoading(false);
    }
    load();
  }, [router, setUser]);

  const ownedItems = user?.ownedItems ?? [];
  const equippedNameColor = user?.equippedNameColor ?? null;
  const equippedAvatar = user?.equippedAvatar ?? user?.avatarId ?? "default";
  const equippedAvatarFrame = user?.equippedAvatarFrame ?? null;
  const equippedAvatarBackground = user?.equippedAvatarBackground ?? null;

  const handleEquip = async (type: CosmeticType, itemId: string | null) => {
    setEquipping(true);
    try {
      const res = await fetch("/api/cosmetics/equip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type, itemId }),
      });
      const json = await res.json();
      if (json.success) {
        const meRes = await fetch("/api/me", { credentials: "include" });
        const meJson = await meRes.json();
        if (meJson.success) setUser(meJson.user ?? null);
      }
    } finally {
      setEquipping(false);
    }
  };

  const getOwnedByType = (type: CosmeticType): CosmeticItem[] => {
    const defaultId = DEFAULT_ITEM_IDS[type];
    return getCosmeticsByType(type).filter(
      (i) => ownedItems.includes(i.id) || i.id === defaultId
    );
  };

  const getEquipped = (type: CosmeticType): string => {
    if (type === "nameColor")
      return equippedNameColor ?? DEFAULT_ITEM_IDS.nameColor;
    if (type === "avatar")
      return getAvatarItemIdByValue(equippedAvatar) ?? DEFAULT_ITEM_IDS.avatar;
    if (type === "avatarFrame")
      return equippedAvatarFrame ?? DEFAULT_ITEM_IDS.avatarFrame;
    return equippedAvatarBackground ?? DEFAULT_ITEM_IDS.avatarBackground;
  };

  function ItemPreview({ item }: { item: CosmeticItem }) {
    if (item.type === "nameColor") {
      return (
        <div
          className="w-full aspect-square rounded-md mb-1 flex items-center justify-center bg-white min-h-[40px]"
        >
          <span
            className="text-[20px] font-bold"
            style={
              item.value.startsWith("linear-gradient")
                ? {
                    background: item.value,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }
                : { color: item.value }
            }
          >
            Aa
          </span>
        </div>
      );
    }
    if (item.type === "avatar") {
      return (
        <img
          src={getCharacterSrc(item.value)}
          alt=""
          className="w-full aspect-square rounded-full mb-1 object-cover min-h-[40px]"
          style={{ border: "2px solid #C0C0C0", boxSizing: "border-box" }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = getCharacterSrc("default");
          }}
        />
      );
    }
    if (item.type === "avatarBackground") {
      return (
        <div
          className="w-full aspect-square rounded-xl mb-1 min-h-[40px] border border-[#1b2833]/10"
          style={{ background: item.value }}
        />
      );
    }
    if (item.type === "avatarFrame") {
      const isRainbow = item.value === "rainbow";
      return (
        <div className="w-full aspect-square rounded-full mb-1 flex items-center justify-center min-h-[40px]">
          {isRainbow ? (
            <div
              className="w-full h-full rounded-full p-[3px]"
              style={{
                background:
                  "linear-gradient(90deg, #FF0000, #FF8800, #FFFF00, #00FF00, #0088FF, #8800FF)",
              }}
            >
              <div className="w-full h-full rounded-full bg-[#f3e6c0]/80" />
            </div>
          ) : (
            <div
              className="w-full h-full rounded-full border-[3px] border-solid bg-[#f3e6c0]/50"
              style={{ borderColor: item.value }}
            />
          )}
        </div>
      );
    }
    return null;
  }

  const nameColorItem = getCosmeticById(
    equippedNameColor ?? DEFAULT_ITEM_IDS.nameColor
  );
  const nameColorStyle = nameColorItem?.value ?? "#1b2833";

  const avatarBgItem = getCosmeticById(
    equippedAvatarBackground ?? DEFAULT_ITEM_IDS.avatarBackground
  );
  const avatarBgStyle = avatarBgItem?.value ?? "#D3D3D3";

  const avatarFrameItem = getCosmeticById(
    equippedAvatarFrame ?? DEFAULT_ITEM_IDS.avatarFrame
  );

  const displayAvatarId = equippedAvatar;

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-[#f3e6c0] text-[#1b2833]">
        <p className="text-sm font-medium opacity-50">Načítavam...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#f3e6c0] text-[#1b2833] overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[480px] mx-auto px-5 pt-8 pb-6">
          <h1 className="text-xl font-bold tracking-tight mb-6">Výbava</h1>

          {/* Preview card */}
          <section className="rounded-2xl bg-[#1b2833] p-8 mb-6 shadow-[0_8px_30px_rgba(27,40,51,0.15)]">
            <div className="flex flex-col items-center gap-5">
              <div
                className="relative flex items-center justify-center w-[150px] h-[150px] rounded-full overflow-hidden"
                style={{ background: avatarBgStyle }}
              >
                {avatarFrameItem?.value === "rainbow" ? (
                  <div
                    className="w-[130px] h-[130px] rounded-full p-[3px]"
                    style={{
                      background:
                        "linear-gradient(90deg, #FF0000, #FF8800, #FFFF00, #00FF00, #0088FF, #8800FF)",
                    }}
                  >
                    <img
                      src={getCharacterSrc(displayAvatarId)}
                      alt="avatar"
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          getCharacterSrc("default");
                      }}
                    />
                  </div>
                ) : (
                  <img
                    src={getCharacterSrc(displayAvatarId)}
                    alt="avatar"
                    className="w-[130px] h-[130px] rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        getCharacterSrc("default");
                    }}
                    style={
                      avatarFrameItem
                        ? {
                            border: `3px solid ${avatarFrameItem.value}`,
                            boxSizing: "border-box",
                          }
                        : { border: "3px solid #C0C0C0", boxSizing: "border-box" }
                    }
                  />
                )}
              </div>
              <div
                className="rounded-full px-5 py-2"
                style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
              >
                <p
                  className="text-[19px] font-bold leading-tight"
                  style={
                    nameColorStyle.startsWith("linear-gradient")
                      ? {
                          background: nameColorStyle,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }
                      : { color: nameColorStyle }
                  }
                >
                  {user?.nickname ?? "Prezývka"}
                </p>
              </div>
            </div>
          </section>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(["nameColor", "avatar", "avatarBackground", "avatarFrame"] as CosmeticType[]).map(
              (t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 min-w-0 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    activeTab === t
                      ? "bg-[#1b2833] text-[#f3e6c0]"
                      : "bg-white/40 text-[#1b2833]/70 hover:bg-white/60"
                  }`}
                >
                  {TAB_LABELS[t]}
                </button>
              )
            )}
          </div>

          {/* Items grid */}
          <div className="grid grid-cols-4 gap-2 overflow-y-auto">
            {getOwnedByType(activeTab).map((item) => {
              const isEquipped = getEquipped(activeTab) === item.id;
              const borderColor = TIER_BORDER_COLORS[item.tier];
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={equipping}
                  onClick={() =>
                    handleEquip(
                      activeTab,
                      isEquipped ? DEFAULT_ITEM_IDS[activeTab] : item.id
                    )
                  }
                  className="relative rounded-lg p-2 bg-white/60 border-2 text-left hover:bg-white/80 transition-colors disabled:opacity-60"
                  style={{ borderColor }}
                >
                  {isEquipped && (
                    <span className="absolute top-1 right-1 text-[8px] font-bold uppercase tracking-wider text-[#1b2833]/70">
                      Nasadené
                    </span>
                  )}
                  <ItemPreview item={item} />
                  <p className="text-[10px] font-semibold leading-tight truncate">
                    {item.name}
                  </p>
                  <p className="text-[8px] text-[#1b2833]/50 truncate">
                    {item.tierLabel}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
