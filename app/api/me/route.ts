import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/lib/firebaseAdmin";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({
      success: true,
      needsOnboarding: false,
      user: {
        wixUserId: decoded.wixUserId,
        nickname: data?.nickname,
        city: data?.city,
        totalXP: data?.totalXP,
        level: data?.level,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: (err as Error)?.message },
      { status: 500 }
    );
  }
}
