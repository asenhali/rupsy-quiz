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

export type NameColorAnimation =
  | "pulse"
  | "shimmer"
  | "flow"
  | "rainbow"
  | "sparkle"
  | "glow"
  | "flash"
  | "glitch"
  | "void";

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
  dark?: string;
  light?: string;
  animation?: NameColorAnimation;
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
    dark?: string;
    light?: string;
    animation?: NameColorAnimation;
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
    dark: "#1b2833",
    light: "#f3e6c0",
    purchasable: false,
  }),
  item("nc_snezna", "Snežná", "nameColor", "bezne", 30, "#2C2C2C", {
    dark: "#2C2C2C",
    light: "#FFFFFF",
  }),
  item("nc_rubinova", "Rubínová", "nameColor", "bezne", 35, "#9B111E", {
    dark: "#9B111E",
    light: "#FF3B3B",
  }),
  item("nc_oceanova", "Oceánová", "nameColor", "bezne", 35, "#1A5276", {
    dark: "#1A5276",
    light: "#5DADE2",
  }),
  item("nc_siva", "Sivá", "nameColor", "bezne", 30, "#4A4A4A", {
    dark: "#4A4A4A",
    light: "#B0B0B0",
  }),
  item("nc_hneda", "Hnedá", "nameColor", "bezne", 30, "#5D4037", {
    dark: "#5D4037",
    light: "#A1887F",
  }),
  item("nc_bezova", "Béžová", "nameColor", "bezne", 30, "#8D6E63", {
    dark: "#8D6E63",
    light: "#D7CCC8",
  }),
  item("nc_smaragdova", "Smaragdová", "nameColor", "neobvykle", 70, "#196F3D", {
    dark: "#196F3D",
    light: "#2ECC71",
  }),
  item("nc_fialkova", "Fialková", "nameColor", "neobvykle", 80, "#6C3483", {
    dark: "#6C3483",
    light: "#BB8FCE",
  }),
  item("nc_tyrkysova", "Tyrkysová", "nameColor", "neobvykle", 75, "#0E6655", {
    dark: "#0E6655",
    light: "#1ABC9C",
  }),
  item("nc_medena", "Medená", "nameColor", "neobvykle", 85, "#8B4513", {
    dark: "#8B4513",
    light: "#CD853F",
  }),
  item("nc_koralova", "Korálová", "nameColor", "neobvykle", 75, "#C0392B", {
    dark: "#C0392B",
    light: "#FF7675",
  }),
  item("nc_olivova", "Olivová", "nameColor", "neobvykle", 70, "#556B2F", {
    dark: "#556B2F",
    light: "#8FBC8F",
  }),
  item("nc_ocelova", "Oceľová", "nameColor", "neobvykle", 90, "#2C3E50", {
    dark: "#2C3E50",
    light: "#7F8C8D",
  }),
  item("nc_jantarova", "Jantárová", "nameColor", "vzacne", 140, "#B7950B", {
    dark: "#B7950B",
    light: "#F4D03F",
  }),
  item("nc_ruzova", "Ružová", "nameColor", "vzacne", 150, "#C2185B", {
    dark: "#C2185B",
    light: "#FF80AB",
  }),
  item("nc_krvava", "Krvavá", "nameColor", "vzacne", 160, "#7B0000", {
    dark: "#7B0000",
    light: "#FF1744",
  }),
  item("nc_sunset", "Sunset", "nameColor", "vzacne", 180, "gradient", {
    dark: "linear-gradient(90deg, #E65100, #AD1457, #6A1B9A)",
    light: "linear-gradient(90deg, #FF9800, #E91E63, #9C27B0)",
    animated: true,
  }),
  item("nc_pulzujuca_modra", "Pulzujúca modrá", "nameColor", "vzacne", 150, "#1565C0", {
    dark: "#1565C0",
    light: "#42A5F5",
    animated: true,
    animation: "pulse",
  }),
  item("nc_matova_vlna", "Mätová vlna", "nameColor", "vzacne", 160, "#00897B", {
    dark: "linear-gradient(90deg, #00897B, #80CBC4, #00897B)",
    light: "linear-gradient(90deg, #80CBC4, #00897B, #80CBC4)",
    animated: true,
    animation: "shimmer",
  }),
  item("nc_ruzovy_sen", "Ružový sen", "nameColor", "vzacne", 170, "#AD1457", {
    dark: "#AD1457",
    light: "#F48FB1",
    animated: true,
    animation: "pulse",
  }),
  item("nc_duhova", "Dúhová", "nameColor", "epicke", 250, "gradient", {
    dark: "linear-gradient(90deg, #FF0000, #FF8800, #FFFF00, #00FF00, #0088FF, #8800FF)",
    light: "linear-gradient(90deg, #FF0000, #FF8800, #FFFF00, #00FF00, #0088FF, #8800FF)",
    animated: true,
    animation: "rainbow",
  }),
  item("nc_ohniva", "Ohnivá", "nameColor", "epicke", 260, "gradient", {
    dark: "linear-gradient(90deg, #BF360C, #E65100, #F57F17)",
    light: "linear-gradient(90deg, #FF4500, #FF8C00, #FFD700)",
    animated: true,
    animation: "flow",
  }),
  item("nc_ladova", "Ľadová", "nameColor", "epicke", 250, "gradient", {
    dark: "linear-gradient(90deg, #0D47A1, #0288D1, #B2EBF2)",
    light: "linear-gradient(90deg, #FFFFFF, #81D4FA, #00BCD4)",
    animated: true,
    animation: "pulse",
  }),
  item("nc_toxicka", "Toxická", "nameColor", "epicke", 270, "gradient", {
    dark: "linear-gradient(90deg, #1B5E20, #76FF03, #FFFF00)",
    light: "linear-gradient(90deg, #00E676, #76FF03, #EEFF41)",
    animated: true,
    animation: "pulse",
  }),
  item("nc_lavova", "Lávová", "nameColor", "epicke", 260, "gradient", {
    dark: "linear-gradient(90deg, #B71C1C, #1A1A1A, #E65100)",
    light: "linear-gradient(90deg, #FF1744, #4A0000, #FF6D00)",
    animated: true,
    animation: "flow",
  }),
  item("nc_mysticka", "Mystická", "nameColor", "epicke", 270, "gradient", {
    dark: "linear-gradient(90deg, #004D40, #4A148C)",
    light: "linear-gradient(90deg, #1DE9B6, #AA00FF)",
    animated: true,
    animation: "flow",
  }),
  item("nc_elektricka", "Elektrická", "nameColor", "epicke", 280, "gradient", {
    dark: "linear-gradient(90deg, #F57F17, #FFFFFF, #F57F17)",
    light: "linear-gradient(90deg, #FFD600, #FFFFFF, #FFD600)",
    animated: true,
    animation: "flash",
  }),
  item("nc_zlata", "Zlatá", "nameColor", "legendarne", 400, "#B8860B", {
    dark: "#B8860B",
    light: "#FFD700",
    animated: true,
    animation: "sparkle",
  }),
  item("nc_neonova", "Neónová", "nameColor", "legendarne", 380, "#00CC00", {
    dark: "#00CC00",
    light: "#39FF14",
    animated: true,
    animation: "glow",
  }),
  item("nc_plazmova", "Plazmová", "nameColor", "legendarne", 420, "gradient", {
    dark: "linear-gradient(90deg, #6A1B9A, #E91E63, #1A237E)",
    light: "linear-gradient(90deg, #CE93D8, #FF80AB, #7986CB)",
    animated: true,
    animation: "flow",
  }),
  item("nc_kralovska", "Kráľovská", "nameColor", "legendarne", 450, "gradient", {
    dark: "linear-gradient(90deg, #4A148C, #B8860B)",
    light: "linear-gradient(90deg, #AA00FF, #FFD700)",
    animated: true,
    animation: "flow",
  }),
  item("nc_glitch", "Glitch", "nameColor", "legendarne", 500, "#00FF00", {
    dark: "#00FF00",
    light: "#00FF00",
    animated: true,
    animation: "glitch",
  }),
  item("nc_diamantova", "Diamantová", "nameColor", "legendarne", 480, "gradient", {
    dark: "linear-gradient(90deg, #E0E0E0, #1A237E, #F8BBD0)",
    light: "linear-gradient(90deg, #FFFFFF, #42A5F5, #FF80AB)",
    animated: true,
    animation: "sparkle",
  }),
  item("nc_cierna_diera", "Čierna diera", "nameColor", "legendarne", 500, "#0A0A0A", {
    dark: "#0A0A0A",
    light: "#1A1A1A",
    animated: true,
    animation: "void",
  }),
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

export type NameColorVariant = "dark" | "light";

export function getNameColorValue(
  item: CosmeticItem | undefined,
  variant: NameColorVariant
): string {
  if (!item || item.type !== "nameColor") return variant === "dark" ? "#1b2833" : "#f3e6c0";
  const val = variant === "dark" ? item.dark ?? item.value : item.light ?? item.value;
  return val ?? (variant === "dark" ? "#1b2833" : "#f3e6c0");
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
