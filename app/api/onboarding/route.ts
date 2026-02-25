import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

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

    await db.collection("users").doc(wixUserId).set({
      wixUserId,
      nickname,
      city,
      avatarId: "default",
      totalXP: 0,
      totalPoints: 0,
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
