import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
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

    const currentUserId = decoded.wixUserId;

    let body: { requestId?: unknown; action?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid input" },
        { status: 400 }
      );
    }

    const requestId = body.requestId;
    const action = body.action;

    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json(
        { success: false, message: "requestId is required" },
        { status: 400 }
      );
    }

    if (action !== "accept" && action !== "reject") {
      return NextResponse.json(
        { success: false, message: "action must be accept or reject" },
        { status: 400 }
      );
    }

    const requestDoc = await db
      .collection("friendRequests")
      .doc(requestId)
      .get();

    if (!requestDoc.exists) {
      return NextResponse.json(
        { success: false, message: "Request not found" },
        { status: 400 }
      );
    }

    const data = requestDoc.data();
    const status = data?.status;
    const fromUserId = data?.fromUserId;
    const toUserId = data?.toUserId;

    if (status !== "pending") {
      return NextResponse.json(
        { success: false, message: "Request already processed" },
        { status: 400 }
      );
    }

    if (toUserId !== currentUserId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await db.collection("friendRequests").doc(requestId).update({
      status: action === "accept" ? "accepted" : "rejected",
    });

    if (action === "accept") {
      await db.collection("friends").add({
        userA: fromUserId,
        userB: toUserId,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("friend respond error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
