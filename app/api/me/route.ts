import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/lib/firebaseAdmin";
import { calculateLevel } from "@/lib/xp";

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
        ownedItems: data?.ownedItems ?? [],
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: (err as Error)?.message },
      { status: 500 }
    );
  }
}
