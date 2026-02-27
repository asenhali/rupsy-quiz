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
      return NextResponse.json({ success: true, quiz: null });
    }

    const quizData = activeQuiz.data();
    const weekId = quizData.weekId ?? activeQuiz.id;

    const completedSession = await db
      .collection("quizSessions")
      .where("userId", "==", wixUserId)
      .where("weekId", "==", weekId)
      .limit(1)
      .get();

    if (!completedSession.empty && completedSession.docs[0].data().completedAt != null) {
      const sessionData = completedSession.docs[0].data();
      return NextResponse.json({
        success: true,
        quiz: {
          weekId,
          status: "completed",
          totalScore: sessionData.totalScore ?? 0,
        },
      });
    }

    const categories = (quizData.categories ?? []).map((c: { name: string }) => ({ name: c.name }));
    const totalQuestions = (quizData.categories ?? []).reduce(
      (acc: number, c: { questionIds?: string[] }) => acc + (c.questionIds?.length ?? 0),
      0
    );

    return NextResponse.json({
      success: true,
      quiz: {
        weekId,
        startsAt: quizData.startsAt,
        endsAt: quizData.endsAt,
        totalQuestions,
        categories,
      },
    });
  } catch (err) {
    console.error("quiz current error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
