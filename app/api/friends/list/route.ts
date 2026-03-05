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

    const [userAIsMeSnapshot, userBIsMeSnapshot] = await Promise.all([
      db
        .collection("friends")
        .where("userA", "==", currentUserId)
        .get(),
      db
        .collection("friends")
        .where("userB", "==", currentUserId)
        .get(),
    ]);

    const friendIds = new Set<string>();

    userAIsMeSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const userB = data.userB as string | undefined;
      if (userB) friendIds.add(userB);
    });

    userBIsMeSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const userA = data.userA as string | undefined;
      if (userA) friendIds.add(userA);
    });

    const friendIdsList = Array.from(friendIds);

    if (friendIdsList.length === 0) {
      return NextResponse.json({
        success: true,
        friends: [],
      });
    }

    const userDocs = await Promise.all(
      friendIdsList.map((id) => db.collection("users").doc(id).get())
    );

    const friends = userDocs
      .map((doc, i) => {
        const wixUserId = friendIdsList[i];
        const data = doc?.data();
        if (!doc?.exists || !data) return null;
        return {
          wixUserId,
          rupsyId: data.rupsyId,
          nickname: data.nickname,
          avatarId: data.equippedAvatar ?? data.avatarId ?? "rupsik",
          city: data.city,
          level: data.level,
        };
      })
      .filter((f): f is NonNullable<typeof f> => f !== null)
      .sort((a, b) => {
        const nickA = (a.nickname ?? "").toLowerCase();
        const nickB = (b.nickname ?? "").toLowerCase();
        return nickA.localeCompare(nickB);
      });

    return NextResponse.json({
      success: true,
      friends,
    });
  } catch (err) {
    console.error("friends list error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
