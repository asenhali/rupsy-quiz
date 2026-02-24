import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { initFirebaseAdmin } from "@/lib/firebaseAdmin";

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

    const decoded = jwt.verify(token, secret) as { wixUserId: string };

    if (!decoded.wixUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const firebaseApp = initFirebaseAdmin();
    if (!firebaseApp) {
      return NextResponse.json(
        { error: "Firebase not initialized" },
        { status: 500 }
      );
    }
    console.log("Firebase Admin initialized successfully");

    return NextResponse.json({
      success: true,
      wixUserId: decoded.wixUserId,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
