import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { FieldValue } from "firebase-admin/firestore";
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

function getOrderedQuestionIds(categories: { questionIds?: string[] }[]): number {
  let count = 0;
  for (const cat of categories) {
    count += cat.questionIds?.length ?? 0;
  }
  return count;
}

export async function POST(request: Request) {
  try {
    const auth = await getWixUserId();
    if ("error" in auth) return auth.error;
    const { wixUserId } = auth;

    let body: { sessionId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON" },
        { status: 400 }
      );
    }

    const { sessionId } = body;
    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: "Missing sessionId" },
        { status: 400 }
      );
    }

    const sessionRef = db.collection("quizSessions").doc(sessionId);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists) {
      return NextResponse.json(
        { success: false, message: "Session not found" },
        { status: 404 }
      );
    }

    const sessionData = sessionSnap.data()!;
    if (sessionData.userId !== wixUserId) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const weekId = sessionData.weekId;
    const weeklyQuizSnap = await db.collection("weeklyQuiz").doc(weekId).get();
    const quizData = weeklyQuizSnap.data() ?? {};
    const totalQuestions = getOrderedQuestionIds(quizData.categories ?? []);

    const answers = sessionData.answers ?? [];
    if (answers.length !== totalQuestions) {
      return NextResponse.json(
        { success: false, message: "Not all questions answered" },
        { status: 400 }
      );
    }

    await sessionRef.update({
      completedAt: new Date(),
    });

    const totalScore = sessionData.totalScore ?? 0;
    const correctCount = (sessionData.answers ?? []).filter(
      (a: { correct?: boolean }) => a.correct === true
    ).length;

    await db.collection("users").doc(wixUserId).update({
      totalGames: FieldValue.increment(1),
      totalCorrect: FieldValue.increment(correctCount),
      totalPoints: FieldValue.increment(totalScore),
    });

    const allSessionsSnap = await db
      .collection("quizSessions")
      .where("weekId", "==", weekId)
      .get();

    const completedSessions = allSessionsSnap.docs.filter(doc => doc.data().completedAt != null);
    const totalPlayers = completedSessions.length;
    let betterCount = 0;
    completedSessions.forEach((doc) => {
      const data = doc.data();
      if ((data.totalScore ?? 0) > totalScore) betterCount++;
    });
    const rank = betterCount + 1;

    return NextResponse.json({
      success: true,
      totalScore,
      rank,
      totalPlayers,
    });
  } catch (err) {
    console.error("quiz complete error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
