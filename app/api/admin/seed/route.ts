import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/lib/firebaseAdmin";

const SEED_ADMIN_ID = "f29e1405-226d-4491-8df4-5ed0bd881e76";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("rupsy_token")?.value ?? null;

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

    const adminsSnapshot = await db.collection("admins").limit(1).get();

    if (!adminsSnapshot.empty) {
      return NextResponse.json({
        success: false,
        message: "Already seeded",
      });
    }

    await db.collection("admins").doc(SEED_ADMIN_ID).set({
      role: "admin",
      addedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Admin seeded",
    });
  } catch (err) {
    console.error("admin seed error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
