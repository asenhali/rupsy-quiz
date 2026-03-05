"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfileModal } from "@/context/ProfileModalContext";
import {
  getCosmeticById,
  getCosmeticsByType,
  TIER_BORDER_COLORS,
  type CosmeticItem,
  type CosmeticType,
} from "@/lib/cosmetics";

const avatarMap: Record<string, string> = {
  default: "/avatars/default.png",
};

const TAB_LABELS: Record<CosmeticType, string> = {
  nameColor: "Farba mena",
  avatarBackground: "Avatar pozadie",
  avatarFrame: "Avatar rámik",
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
    return getCosmeticsByType(type).filter((i) => ownedItems.includes(i.id));
  };

  const getEquipped = (type: CosmeticType): string | null => {
    if (type === "nameColor") return equippedNameColor;
    if (type === "avatarFrame") return equippedAvatarFrame;
    return equippedAvatarBackground;
  };

  const getPreviewStyle = (item: CosmeticItem) => {
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
        boxSizing: "border-box",
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
          <section className="rounded-2xl bg-[#1b2833] p-6 mb-6 shadow-[0_8px_30px_rgba(27,40,51,0.15)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f3e6c0]/50 mb-4">
              Náhľad
            </p>
            <div className="flex flex-col items-center gap-4">
              <div
                className="relative flex items-center justify-center w-24 h-24 rounded-full overflow-hidden"
                style={{ background: avatarBgStyle }}
              >
                {avatarFrameItem?.value === "rainbow" ? (
                  <div
                    className="w-20 h-20 rounded-full p-[3px]"
                    style={{
                      background:
                        "linear-gradient(90deg, #FF0000, #FF8800, #FFFF00, #00FF00, #0088FF, #8800FF)",
                    }}
                  >
                    <img
                      src={avatarMap[user?.avatarId ?? ""] || avatarMap.default}
                      alt="avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                ) : (
                  <img
                    src={avatarMap[user?.avatarId ?? ""] || avatarMap.default}
                    alt="avatar"
                    className="w-20 h-20 rounded-full object-cover"
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
              <p
                className="text-lg font-bold"
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
          </section>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {(["nameColor", "avatarBackground", "avatarFrame"] as CosmeticType[]).map(
              (t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
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
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                {/* Default / unequip option */}
                <button
                  type="button"
                  disabled={equipping}
                  onClick={() => handleEquip(activeTab, null)}
                  className={`relative rounded-xl p-4 bg-white/60 border-2 text-left hover:bg-white/80 transition-colors disabled:opacity-60 ${
                    getEquipped(activeTab) === null
                      ? "ring-2 ring-[#1b2833] ring-offset-2"
                      : ""
                  }`}
                  style={{ borderColor: "#808080" }}
                >
                  {getEquipped(activeTab) === null && (
                    <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider text-[#1b2833]/70">
                      Nasadené
                    </span>
                  )}
                  <div
                    className="w-full h-8 rounded-lg mb-2 border border-[#1b2833]/20 bg-[#1b2833]/5"
                  />
                  <p className="text-sm font-semibold">Predvolené</p>
                  <p className="text-[10px] text-[#1b2833]/50 mt-0.5">
                    Žiadna úprava
                  </p>
                </button>
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
                      className="relative rounded-xl p-4 bg-white/60 border-2 text-left hover:bg-white/80 transition-colors disabled:opacity-60"
                      style={{ borderColor }}
                    >
                      {isEquipped && (
                        <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider text-[#1b2833]/70">
                          Nasadené
                        </span>
                      )}
                      <div
                        className="w-full h-8 rounded-lg mb-2 border border-[#1b2833]/10"
                        style={getPreviewStyle(item)}
                      />
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="text-[10px] text-[#1b2833]/50 mt-0.5">
                        {item.tierLabel}
                      </p>
                    </button>
                  );
                })}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
