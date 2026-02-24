import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getFirestore } from "firebase-admin/firestore";
import { initFirebaseAdmin } from "@/lib/firebaseAdmin";

export async function GET(request: Request) {
  try {
    console.log("AUTH HEADER RAW:", request.headers.get("authorization"));
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = process.env.INTERNAL_WIX_SECRET;
    console.log("SECRET LENGTH:", secret?.length);
    console.log("SECRET VALUE START:", secret?.slice(0, 5));
    console.log("SECRET VALUE END:", secret?.slice(-5));
    if (!secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: { wixUserId: string };
    try {
      console.log("NOW:", Math.floor(Date.now() / 1000));
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

    let firebaseApp;
    try {
      firebaseApp = initFirebaseAdmin();
    } catch (err) {
      console.error("FIREBASE INIT ERROR:", err);
      return NextResponse.json(
        { error: "Firebase init failed", details: (err as Error).message },
        { status: 500 }
      );
    }
    if (!firebaseApp) {
      return NextResponse.json(
        { error: "Firebase not initialized" },
        { status: 500 }
      );
    }
    console.log("Firebase Admin initialized successfully");

    const db = getFirestore(firebaseApp);
    db.settings({ preferRest: true });
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
