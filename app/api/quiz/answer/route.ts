import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
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

function getOrderedQuestionIds(categories: { questionIds?: string[] }[]): string[] {
  const ids: string[] = [];
  for (const cat of categories) {
    for (const id of cat.questionIds ?? []) {
      ids.push(id);
    }
  }
  return ids;
}

function getCategoryNameForQuestion(questionId: string, categories: { name: string; questionIds?: string[] }[]): string {
  for (const cat of categories) {
    if (cat.questionIds?.includes(questionId)) return cat.name ?? "";
  }
  return "";
}

export async function POST(request: Request) {
  try {
    const auth = await getWixUserId();
    if ("error" in auth) return auth.error;
    const { wixUserId } = auth;

    let body: { sessionId?: string; questionId?: string; selectedIndex?: number; timeMs?: number };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON" },
        { status: 400 }
      );
    }

    const { sessionId, questionId, selectedIndex, timeMs } = body;
    if (!sessionId || !questionId || selectedIndex == null || timeMs == null) {
      return NextResponse.json(
        { success: false, message: "Missing sessionId, questionId, selectedIndex, or timeMs" },
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

    if (sessionData.completedAt) {
      return NextResponse.json(
        { success: false, message: "Session already completed" },
        { status: 400 }
      );
    }

    const questionSnap = await db.collection("questions").doc(questionId).get();
    if (!questionSnap.exists) {
      return NextResponse.json(
        { success: false, message: "Question not found" },
        { status: 404 }
      );
    }

    const qData = questionSnap.data()!;
    const correctIndex = qData.correctIndex ?? 0;
    const timeLimitSec = qData.timeLimitSec ?? 30;

    let score = 0;
    const correct = selectedIndex === correctIndex;
    const timeLimitMs = timeLimitSec * 1000;

    if (correct && timeMs < timeLimitMs) {
      score = Math.round(1000 * (1 - timeMs / timeLimitMs));
      score = Math.max(0, Math.min(1000, score));
    }

    const answerEntry = {
      questionId,
      selectedIndex,
      timeMs,
      points: score,
      correct,
    };

    const weekId = sessionData.weekId;
    const weeklyQuizSnap = await db.collection("weeklyQuiz").doc(weekId).get();
    const quizData = weeklyQuizSnap.data() ?? {};
    const categories = quizData.categories ?? [];
    const questionIds = getOrderedQuestionIds(categories);
    const totalQuestions = questionIds.length;

    const currentQuestionIndex = (sessionData.currentQuestionIndex ?? 0) + 1;
    const newTotalScore = (sessionData.totalScore ?? 0) + score;
    const answers = [...(sessionData.answers ?? []), answerEntry];

    await sessionRef.update({
      totalScore: newTotalScore,
      currentQuestionIndex,
      answers,
    });

    if (currentQuestionIndex >= totalQuestions) {
      return NextResponse.json({
        success: true,
        pointsEarned: score,
        completed: true,
      });
    }

    const nextQuestionId = questionIds[currentQuestionIndex];
    const nextQuestionSnap = await db.collection("questions").doc(nextQuestionId).get();
    if (!nextQuestionSnap.exists) {
      return NextResponse.json(
        { success: false, message: "Next question not found" },
        { status: 500 }
      );
    }

    const nextQData = nextQuestionSnap.data()!;
    const { correctIndex: _c2, ...nextQuestionSafe } = nextQData as { correctIndex?: number; [k: string]: unknown };
    const categoryName = getCategoryNameForQuestion(nextQuestionId, categories);
    const question = {
      id: nextQuestionId,
      ...nextQuestionSafe,
      categoryName,
    };

    return NextResponse.json({
      success: true,
      pointsEarned: score,
      currentQuestionIndex,
      totalQuestions,
      question,
    });
  } catch (err) {
    console.error("quiz answer error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
