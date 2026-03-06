import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/lib/firebaseAdmin";
import { calculateLevel } from "@/lib/xp";

// TODO: Remove — testing only: grant all items for Výbava preview
const TEST_NAME_COLOR_IDS = [
  "nc_default", "nc_snezna", "nc_rubinova", "nc_oceanova", "nc_siva", "nc_hneda", "nc_bezova",
  "nc_smaragdova", "nc_fialkova", "nc_tyrkysova", "nc_medena", "nc_koralova", "nc_olivova", "nc_ocelova",
  "nc_jantarova", "nc_ruzova", "nc_krvava", "nc_sunset", "nc_pulzujuca_modra", "nc_matova_vlna", "nc_ruzovy_sen",
  "nc_duhova", "nc_ohniva", "nc_ladova", "nc_toxicka", "nc_lavova", "nc_mysticka", "nc_elektricka",
  "nc_zlata", "nc_neonova", "nc_plazmova", "nc_kralovska", "nc_glitch", "nc_diamantova", "nc_cierna_diera",
];
const TEST_CHARACTER_IDS = [
  "ch_rupsik",
  "ch_medved",
  "ch_jelen",
  "ch_lyska",
  "ch_jezko",
  "ch_rys",
  "ch_vlk",
  "ch_zajac",
  "ch_diviak",
  "ch_jazvec",
  "ch_bazant",
  "ch_srnka",
  "ch_jastrab",
  "ch_vevericka",
  "ch_kamzik",
  "ch_svist",
  "ch_sova",
  "ch_kuna",
  "ch_orol",
];

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    let token =
      authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get("rupsy_token")?.value ?? null;
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const secret = process.env.INTERNAL_WIX_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: { wixUserId: string };
    try {
      decoded = jwt.verify(token, secret) as { wixUserId: string };
    } catch (err) {
      console.error("JWT VERIFY ERROR:", err);
      return NextResponse.json(
        { error: "Unauthorized", details: (err as Error).message },
        { status: 401 }
      );
    }

    if (!decoded.wixUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userDoc = await db
      .collection("users")
      .doc(decoded.wixUserId)
      .get();

    if (!userDoc.exists) {
      return NextResponse.json({
        success: true,
        needsOnboarding: true,
        user: null,
      });
    }

    const data = userDoc.data();
    const totalXP = data?.totalXP ?? 0;
    const levelData = calculateLevel(totalXP);

    return NextResponse.json({
      success: true,
      needsOnboarding: false,
      user: {
        wixUserId: decoded.wixUserId,
        rupsyId: data?.rupsyId,
        nickname: data?.nickname,
        city: data?.city,
        totalXP,
        level: levelData.level,
        xpForCurrentLevel: levelData.xpForCurrentLevel,
        xpForNextLevel: levelData.xpForNextLevel,
        progressPercent: levelData.progressPercent,
        avatarId: data?.avatarId ?? "rupsik",
        totalPoints: data?.totalPoints ?? 0,
        rCoins: data?.rCoins ?? 0,
        totalGames: data?.totalGames ?? 0,
        totalCorrect: data?.totalCorrect ?? 0,
        equippedNameColor: data?.equippedNameColor ?? null,
        equippedAvatar: data?.equippedAvatar ?? data?.avatarId ?? "rupsik",
        equippedAvatarFrame: data?.equippedAvatarFrame ?? null,
        equippedAvatarBackground: data?.equippedAvatarBackground ?? null,
        ownedItems: [
          ...(data?.ownedItems ?? []),
          ...TEST_NAME_COLOR_IDS.filter(
            (id) => !(data?.ownedItems ?? []).includes(id)
          ),
          ...TEST_CHARACTER_IDS.filter(
            (id) => !(data?.ownedItems ?? []).includes(id)
          ),
        ],
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: (err as Error)?.message },
      { status: 500 }
    );
  }
}
