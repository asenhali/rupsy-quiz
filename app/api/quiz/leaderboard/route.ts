import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { db } from "@/lib/firebaseAdmin";

async function getWixUserId(): Promise<{ wixUserId: string } | { error: NextResponse }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("rupsy_token")?.value ?? null;
  if (!token) {
    return { error: NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 }) };
  }
  const secret = process.env.INTERNAL_WIX_SECRET;
  if (!secret) {
    return { error: NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 }) };
  }
  try {
    const decoded = jwt.verify(token, secret) as { wixUserId?: string };
    const wixUserId = decoded.wixUserId ?? "";
    if (!wixUserId) {
      return { error: NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 }) };
    }
    return { wixUserId };
  } catch (err) {
    console.error("JWT VERIFY ERROR:", err);
    return { error: NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 }) };
  }
}

export async function GET() {
  try {
    const auth = await getWixUserId();
    if ("error" in auth) return auth.error;
    const { wixUserId } = auth;

    const now = new Date();
    const snapshot = await db
      .collection("weeklyQuiz")
      .where("endsAt", ">=", now)
      .limit(20)
      .get();

    let activeQuiz: QueryDocumentSnapshot | null = null;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const startsAt = data.startsAt?.toDate?.() ?? data.startsAt;
      if (startsAt && new Date(startsAt) <= now) {
        activeQuiz = doc;
        break;
      }
    }

    if (!activeQuiz) {
      return NextResponse.json({ success: true, entries: [], userRank: null });
    }

    const quizData = activeQuiz.data();
    const weekId = quizData.weekId ?? activeQuiz.id;

    const sessionsSnap = await db
      .collection("quizSessions")
      .where("weekId", "==", weekId)
      .get();

    const completedSessions = sessionsSnap.docs.filter(
      (doc) => doc.data().completedAt != null
    );

    const sessionsWithData = completedSessions.map((doc) => {
      const d = doc.data();
      return {
        userId: d.userId as string,
        totalScore: d.totalScore ?? 0,
        completedAt: d.completedAt?.toDate?.() ?? d.completedAt,
      };
    });

    sessionsWithData.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return aTime - bTime;
    });

    const top50 = sessionsWithData.slice(0, 50);
    const userIds = [...new Set(top50.map((s) => s.userId))];
    const userDocs = await Promise.all(
      userIds.map((id) => db.collection("users").doc(id).get())
    );
    const userIdToUser = new Map<string, {
      nickname?: string;
      city?: string;
      equippedAvatar?: string;
      equippedAvatarBackground?: string | null;
      equippedAvatarFrame?: string | null;
    }>();
    userIds.forEach((id, i) => {
      const data = userDocs[i]?.data();
      userIdToUser.set(id, {
        nickname: data?.nickname,
        city: data?.city,
        equippedAvatar: data?.equippedAvatar ?? data?.avatarId ?? "rupsik",
        equippedAvatarBackground: data?.equippedAvatarBackground ?? null,
        equippedAvatarFrame: data?.equippedAvatarFrame ?? null,
      });
    });

    const entries = top50.map((s, i) => {
      const u = userIdToUser.get(s.userId) ?? {};
      return {
        rank: i + 1,
        nickname: u.nickname ?? "—",
        city: u.city ?? "",
        score: s.totalScore,
        isCurrentUser: s.userId === wixUserId,
        equippedAvatar: u.equippedAvatar ?? "rupsik",
        equippedAvatarBackground: u.equippedAvatarBackground ?? null,
        equippedAvatarFrame: u.equippedAvatarFrame ?? null,
      };
    });

    const userSessionIdx = sessionsWithData.findIndex((s) => s.userId === wixUserId);
    const userRank =
      userSessionIdx >= 0
        ? {
            rank: userSessionIdx + 1,
            score: sessionsWithData[userSessionIdx]!.totalScore,
          }
        : null;

    return NextResponse.json({
      success: true,
      entries,
      userRank,
    });
  } catch (err) {
    console.error("quiz leaderboard error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
