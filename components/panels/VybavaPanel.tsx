"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfileModal } from "@/context/ProfileModalContext";
import {
  getCosmeticById,
  getCosmeticsByType,
  getAvatarItemIdByValue,
  TIER_BORDER_COLORS,
  type CosmeticItem,
  type CosmeticType,
} from "@/lib/cosmetics";

const avatarMap: Record<string, string> = {
  default: "/avatars/default.png",
};

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
    const items = getCosmeticsByType(type).filter((i) =>
      ownedItems.includes(i.id) || (type === "avatar" && i.id === "av_default")
    );
    return items;
  };

  const getEquipped = (type: CosmeticType): string | null => {
    if (type === "nameColor") return equippedNameColor;
    if (type === "avatar")
      return getAvatarItemIdByValue(equippedAvatar) ?? "av_default";
    if (type === "avatarFrame") return equippedAvatarFrame;
    return equippedAvatarBackground;
  };

  const getPreviewStyle = (item: CosmeticItem): React.CSSProperties => {
    if (item.type === "avatar") {
      return {};
    }
    if (item.type === "nameColor" || item.type === "avatarBackground") {
      return { background: item.value };
    }
    if (item.type === "avatarFrame") {
      if (item.value === "rainbow") {
        return {
          background:
            "linear-gradient(90deg, #FF0000, #FF8800, #FFFF00, #00FF00, #0088FF, #8800FF)",
        };
      }
      return {
        border: `3px solid ${item.value}`,
        boxSizing: "border-box" as const,
      };
    }
    return {};
  };

  const nameColorItem = equippedNameColor
    ? getCosmeticById(equippedNameColor)
    : null;
  const nameColorStyle = nameColorItem?.value ?? "#1b2833";

  const avatarBgItem = equippedAvatarBackground
    ? getCosmeticById(equippedAvatarBackground)
    : null;
  const avatarBgStyle = avatarBgItem?.value ?? "#1b2833";

  const avatarFrameItem = equippedAvatarFrame
    ? getCosmeticById(equippedAvatarFrame)
    : null;

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
                      src={avatarMap[displayAvatarId] || `/avatars/${displayAvatarId}.png`}
                      alt="avatar"
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/avatars/default.png";
                      }}
                    />
                  </div>
                ) : (
                  <img
                    src={avatarMap[displayAvatarId] || `/avatars/${displayAvatarId}.png`}
                    alt="avatar"
                    className="w-[130px] h-[130px] rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/avatars/default.png";
                    }}
                    style={
                      avatarFrameItem
                        ? {
                            border: `3px solid ${avatarFrameItem.value}`,
                            boxSizing: "border-box",
                          }
                        : { border: "2px solid rgba(243,230,192,0.3)" }
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
            {activeTab !== "avatar" && (
              <button
                type="button"
                disabled={equipping}
                onClick={() => handleEquip(activeTab, null)}
                className={`relative rounded-lg p-2 bg-white/60 border-2 text-left hover:bg-white/80 transition-colors disabled:opacity-60 ${
                  getEquipped(activeTab) === null
                    ? "ring-2 ring-[#1b2833] ring-offset-1"
                    : ""
                }`}
                style={{ borderColor: "#808080" }}
              >
                {getEquipped(activeTab) === null && (
                  <span className="absolute top-1 right-1 text-[8px] font-bold uppercase tracking-wider text-[#1b2833]/70">
                    Nasadené
                  </span>
                )}
                <div
                  className="w-full aspect-square rounded-md mb-1 border border-[#1b2833]/20 bg-[#1b2833]/5"
                />
                <p className="text-[10px] font-semibold leading-tight truncate">
                  Predvolené
                </p>
              </button>
            )}
            {getOwnedByType(activeTab).map((item) => {
              const isEquipped = getEquipped(activeTab) === item.id;
              const borderColor = TIER_BORDER_COLORS[item.tier];
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={equipping}
                  onClick={() =>
                    handleEquip(activeTab, isEquipped ? null : item.id)
                  }
                  className="relative rounded-lg p-2 bg-white/60 border-2 text-left hover:bg-white/80 transition-colors disabled:opacity-60"
                  style={{ borderColor }}
                >
                  {isEquipped && (
                    <span className="absolute top-1 right-1 text-[8px] font-bold uppercase tracking-wider text-[#1b2833]/70">
                      Nasadené
                    </span>
                  )}
                  {item.type === "avatar" ? (
                    <img
                      src={avatarMap[item.value] || `/avatars/${item.value}.png`}
                      alt=""
                      className="w-full aspect-square rounded-md mb-1 object-cover border border-[#1b2833]/10"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/avatars/default.png";
                      }}
                    />
                  ) : (
                    <div
                      className="w-full aspect-square rounded-md mb-1 border border-[#1b2833]/10"
                      style={getPreviewStyle(item)}
                    />
                  )}
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
