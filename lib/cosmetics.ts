export type CosmeticType =
  | "nameColor"
  | "avatar"
  | "avatarFrame"
  | "avatarBackground";
export type CosmeticTier =
  | "bezne"
  | "neobvykle"
  | "vzacne"
  | "epicke"
  | "legendarne"
  | "exkluzivne";

const TIER_LABELS: Record<CosmeticTier, string> = {
  bezne: "Bežné",
  neobvykle: "Neobvyklé",
  vzacne: "Vzácne",
  epicke: "Epické",
  legendarne: "Legendárne",
  exkluzivne: "Exkluzívne",
};

export const TIER_BORDER_COLORS: Record<CosmeticTier, string> = {
  bezne: "#808080",
  neobvykle: "#2ECC71",
  vzacne: "#3498DB",
  epicke: "#9B59B6",
  legendarne: "#FFD700",
  exkluzivne: "#E74C3C",
};

export type CosmeticItem = {
  id: string;
  name: string;
  type: CosmeticType;
  tier: CosmeticTier;
  tierLabel: string;
  price: number;
  value: string;
  preview: string;
  purchasable: boolean;
  animated?: boolean;
  style?: "solid" | "animated";
};

function item(
  id: string,
  name: string,
  type: CosmeticType,
  tier: CosmeticTier,
  price: number,
  value: string,
  opts?: {
    animated?: boolean;
    style?: "solid" | "animated";
    purchasable?: boolean;
  }
): CosmeticItem {
  return {
    id,
    name,
    type,
    tier,
    tierLabel: TIER_LABELS[tier],
    price,
    value,
    preview: value,
    purchasable: opts?.purchasable ?? tier !== "exkluzivne",
    ...opts,
  };
}

export const DEFAULT_ITEM_IDS: Record<CosmeticType, string> = {
  nameColor: "nc_default",
  avatar: "av_default",
  avatarBackground: "ab_default",
  avatarFrame: "af_default",
};

export const COSMETIC_ITEMS: CosmeticItem[] = [
  // NAME COLORS
  item("nc_default", "Predvolená", "nameColor", "bezne", 0, "#1b2833", {
    purchasable: false,
  }),
  item("nc_white", "Biela", "nameColor", "bezne", 30, "#FFFFFF"),
  item("nc_red", "Červená", "nameColor", "bezne", 40, "#FF4444"),
  item("nc_blue", "Modrá", "nameColor", "bezne", 35, "#4488FF"),
  item("nc_green", "Zelená", "nameColor", "neobvykle", 70, "#44FF88"),
  item("nc_purple", "Fialová", "nameColor", "neobvykle", 80, "#AA44FF"),
  item("nc_gold", "Zlatá", "nameColor", "vzacne", 150, "#FFD700"),
  item(
    "nc_rainbow",
    "Dúhová",
    "nameColor",
    "epicke",
    250,
    "linear-gradient(90deg, #FF0000, #FF8800, #FFFF00, #00FF00, #0088FF, #8800FF)",
    { animated: true }
  ),
  item(
    "nc_fire",
    "Ohnivá",
    "nameColor",
    "legendarne",
    400,
    "linear-gradient(90deg, #FF4500, #FF8C00, #FFD700)",
    { animated: true }
  ),
  // AVATAR BACKGROUNDS
  item("ab_default", "Predvolené", "avatarBackground", "bezne", 0, "#D3D3D3", {
    purchasable: false,
  }),
  item("ab_cream", "Krémová", "avatarBackground", "bezne", 30, "#f3e6c0"),
  item("ab_sky", "Nebeská", "avatarBackground", "bezne", 35, "#87CEEB"),
  item("ab_pink", "Ružová", "avatarBackground", "neobvykle", 75, "#FF69B4"),
  item(
    "ab_gradient_sunset",
    "Západ slnka",
    "avatarBackground",
    "vzacne",
    160,
    "linear-gradient(135deg, #FF6B6B, #FFE66D)"
  ),
  item(
    "ab_gradient_ocean",
    "Oceán",
    "avatarBackground",
    "epicke",
    220,
    "linear-gradient(135deg, #0077B6, #00B4D8, #90E0EF)"
  ),
  // AVATARS (postavička) — value = character id, image at /characters/{value}.png
  item("av_default", "RUPSY Logo", "avatar", "bezne", 0, "default", {
    purchasable: false,
  }),
  item("av_1", "Alternatíva 1", "avatar", "bezne", 20, "1"),
  item("av_2", "Alternatíva 2", "avatar", "neobvykle", 50, "2"),
  // AVATAR FRAMES
  item("af_default", "Predvolený", "avatarFrame", "bezne", 0, "#C0C0C0", {
    style: "solid",
    purchasable: false,
  }),
  item("af_silver", "Strieborný", "avatarFrame", "neobvykle", 90, "#C0C0C0", {
    style: "solid",
  }),
  item("af_gold", "Zlatý", "avatarFrame", "vzacne", 180, "#FFD700", {
    style: "solid",
  }),
  item("af_animated_gold", "Žiarivý zlatý", "avatarFrame", "epicke", 280, "#FFD700", {
    style: "animated",
  }),
  item("af_animated_rainbow", "Dúhový", "avatarFrame", "legendarne", 450, "rainbow", {
    style: "animated",
  }),
];

export function getCosmeticById(id: string): CosmeticItem | undefined {
  return COSMETIC_ITEMS.find((i) => i.id === id);
}

export function getCosmeticsByType(type: CosmeticType): CosmeticItem[] {
  return COSMETIC_ITEMS.filter((i) => i.type === type);
}

export function getAvatarItemIdByValue(avatarValue: string): string | null {
  const item = COSMETIC_ITEMS.find(
    (i) => i.type === "avatar" && i.value === avatarValue
  );
  return item?.id ?? null;
}
