import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/lib/firebaseAdmin";

export async function GET() {
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

    const [incomingSnapshot, outgoingSnapshot] = await Promise.all([
      db
        .collection("friendRequests")
        .where("toUserId", "==", currentUserId)
        .where("status", "==", "pending")
        .get(),
      db
        .collection("friendRequests")
        .where("fromUserId", "==", currentUserId)
        .where("status", "==", "pending")
        .get(),
    ]);

    const incomingRequests = incomingSnapshot.docs.map((doc) => {
      const data = doc.data();
      return { requestId: doc.id, fromUserId: data.fromUserId as string };
    });

    const outgoingRequests = outgoingSnapshot.docs.map((doc) => {
      const data = doc.data();
      return { requestId: doc.id, toUserId: data.toUserId as string };
    });

    const userIdsToFetch = [
      ...new Set([
        ...incomingRequests.map((r) => r.fromUserId),
        ...outgoingRequests.map((r) => r.toUserId),
      ]),
    ];

    const userDocs =
      userIdsToFetch.length > 0
        ? await Promise.all(
            userIdsToFetch.map((id) =>
              db.collection("users").doc(id).get()
            )
          )
        : [];

    const userMap = new Map<
      string,
      { rupsyId?: string; nickname?: string; city?: string; level?: number }
    >();
    userIdsToFetch.forEach((id, i) => {
      const doc = userDocs[i];
      const data = doc?.data();
      userMap.set(id, {
        rupsyId: data?.rupsyId,
        nickname: data?.nickname,
        city: data?.city,
        level: data?.level,
      });
    });

    const incoming = incomingRequests.map((r) => ({
      requestId: r.requestId,
      user: userMap.get(r.fromUserId) ?? {},
    }));

    const outgoing = outgoingRequests.map((r) => ({
      requestId: r.requestId,
      user: userMap.get(r.toUserId) ?? {},
    }));

    return NextResponse.json({
      success: true,
      incoming,
      outgoing,
    });
  } catch (err) {
    console.error("friends requests error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
