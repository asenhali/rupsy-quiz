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
  avatar: "ch_rupsik",
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
  // AVATARS (postavička) — value = character id for /characters/{value}.png
  item("ch_rupsik", "Rupsík", "avatar", "bezne", 0, "rupsik", {
    purchasable: false,
  }),
  item("ch_medved", "Ľubo", "avatar", "bezne", 35, "medved"),
  item("ch_jelen", "Tomáš", "avatar", "bezne", 40, "jelen"),
  item("ch_lyska", "Iveta", "avatar", "bezne", 35, "lyska"),
  item("ch_jezko", "Teo", "avatar", "bezne", 30, "jezko"),
  item("ch_rys", "Šimon", "avatar", "bezne", 45, "rys"),
  item("ch_vlk", "Matej", "avatar", "bezne", 40, "vlk"),
  item("ch_zajac", "Amélia", "avatar", "bezne", 30, "zajac"),
  item("ch_diviak", "Dušan", "avatar", "bezne", 35, "diviak"),
  item("ch_jazvec", "Michal", "avatar", "bezne", 40, "jazvec"),
  item("ch_bazant", "Viktória", "avatar", "bezne", 30, "bazant"),
  item("ch_srnka", "Kamila", "avatar", "bezne", 35, "srnka"),
  item("ch_jastrab", "Lukáš", "avatar", "bezne", 45, "jastrab"),
  item("ch_vevericka", "Nina", "avatar", "bezne", 35, "vevericka"),
  item("ch_kamzik", "Adam", "avatar", "bezne", 45, "kamzik"),
  item("ch_svist", "Imrich", "avatar", "bezne", 30, "svist"),
  item("ch_sova", "Mirka", "avatar", "bezne", 40, "sova"),
  item("ch_kuna", "Michaela", "avatar", "bezne", 35, "kuna"),
  item("ch_orol", "Rišo", "avatar", "bezne", 50, "orol-skalny"),
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

const RAINBOW_GRADIENT =
  "linear-gradient(90deg, #FF0000, #FF8800, #FFFF00, #00FF00, #0088FF, #8800FF)";

export type ResolvedAvatarCosmetics = {
  background: string;
  frame: string;
  frameStyle: "solid" | "animated";
};

export function resolveAvatarCosmetics(
  avatarBackgroundId: string | null,
  avatarFrameId: string | null
): ResolvedAvatarCosmetics {
  const bgItem = avatarBackgroundId
    ? getCosmeticById(avatarBackgroundId)
    : getCosmeticById(DEFAULT_ITEM_IDS.avatarBackground);
  const frameItem = avatarFrameId
    ? getCosmeticById(avatarFrameId)
    : getCosmeticById(DEFAULT_ITEM_IDS.avatarFrame);

  const background = bgItem?.value ?? "#D3D3D3";
  const frameValue = frameItem?.value ?? "#C0C0C0";
  const frameStyle = frameItem?.style ?? "solid";
  const frame =
    frameValue === "rainbow" ? RAINBOW_GRADIENT : frameValue;

  return {
    background,
    frame: frame as string,
    frameStyle: (frameStyle === "animated" ? "animated" : "solid") as
      | "solid"
      | "animated",
  };
}
