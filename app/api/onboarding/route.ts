import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebaseAdmin";

const RUPSY_CHARS = "ABCDEFGHJKLMNPQRTUVWXYZ2346789";

function generateRupsyId(): string {
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += RUPSY_CHARS[Math.floor(Math.random() * RUPSY_CHARS.length)];
  }
  return `RUPSY-${code}`;
}

export async function POST(request: Request) {
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
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    let decoded: { wixUserId: string };
    try {
      decoded = jwt.verify(token, secret) as { wixUserId: string };
    } catch (err) {
      console.error("JWT VERIFY ERROR:", err);
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    if (!decoded.wixUserId) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    let body: { nickname?: unknown; city?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid input" },
        { status: 400 }
      );
    }

    const { nickname: rawNickname, city: rawCity } = body;

    if (
      typeof rawNickname !== "string" ||
      typeof rawCity !== "string"
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid input" },
        { status: 400 }
      );
    }

    const nickname = rawNickname.trim();
    const city = rawCity.trim();

    if (nickname.length < 2 || nickname.length > 20) {
      return NextResponse.json(
        { success: false, message: "Invalid nickname length" },
        { status: 400 }
      );
    }

    const wixUserId = decoded.wixUserId;

    let rupsyId = "";
    let exists: boolean;
    do {
      rupsyId = generateRupsyId();
      const existing = await db
        .collection("users")
        .where("rupsyId", "==", rupsyId)
        .limit(1)
        .get();
      exists = !existing.empty;
    } while (exists);

    await db.collection("users").doc(wixUserId).set({
      wixUserId,
      rupsyId,
      nickname,
      city,
      avatarId: "default",
      totalXP: 0,
      totalPoints: 0,
      rCoins: 0,
      level: 1,
      totalGames: 0,
      totalCorrect: 0,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "User onboarded",
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Invalid token" },
      { status: 401 }
    );
  }
}
