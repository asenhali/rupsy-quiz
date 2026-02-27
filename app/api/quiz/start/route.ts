import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import type { DocumentSnapshot, QueryDocumentSnapshot } from "firebase-admin/firestore";
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

export async function POST() {
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
      return NextResponse.json(
        { success: false, message: "Žiadny aktívny kvíz" },
        { status: 404 }
      );
    }

    const quizData = activeQuiz.data();
    const weekId = quizData.weekId ?? activeQuiz.id;
    const categories = quizData.categories ?? [];
    const questionIds = getOrderedQuestionIds(categories);
    const totalQuestions = questionIds.length;

    const existingSessions = await db
      .collection("quizSessions")
      .where("userId", "==", wixUserId)
      .where("weekId", "==", weekId)
      .get();

    let sessionDoc: DocumentSnapshot | null = existingSessions.docs[0] ?? null;
    let sessionData = sessionDoc?.data();

    if (sessionData?.completedAt) {
      return NextResponse.json({
        success: false,
        message: "Kvíz si už absolvoval",
      });
    }

    if (!sessionDoc) {
      const newSessionRef = db.collection("quizSessions").doc();
      await newSessionRef.set({
        userId: wixUserId,
        weekId,
        startedAt: new Date(),
        totalScore: 0,
        answers: [],
        completedAt: null,
        currentQuestionIndex: 0,
      });
      sessionDoc = await newSessionRef.get();
      sessionData = sessionDoc?.data();
    }

    const sessionId = sessionDoc!.id;
    const currentQuestionIndex = sessionData?.currentQuestionIndex ?? 0;

    if (totalQuestions === 0) {
      return NextResponse.json(
        { success: false, message: "Kvíz nemá žiadne otázky" },
        { status: 400 }
      );
    }

    const questionId = questionIds[currentQuestionIndex];
    const questionSnap = await db.collection("questions").doc(questionId).get();
    if (!questionSnap.exists) {
      return NextResponse.json(
        { success: false, message: "Question not found" },
        { status: 500 }
      );
    }

    const qData = questionSnap.data()!;
    const categoryName = getCategoryNameForQuestion(questionId, categories);

    const { correctIndex: _c, ...questionSafe } = qData as { correctIndex?: number; [k: string]: unknown };
    const question = {
      id: questionId,
      ...questionSafe,
      categoryName,
    };

    return NextResponse.json({
      success: true,
      sessionId,
      currentQuestionIndex,
      totalQuestions,
      question,
    });
  } catch (err) {
    console.error("quiz start error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
