import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/lib/firebaseAdmin";
import { isAdmin } from "@/lib/isAdmin";

type Question = {
  text: string;
  type: string;
  imageUrl?: string;
  answers: string[];
  correctIndex: number;
  timeLimitSec: number;
};

type Category = {
  name: string;
  questions: Question[];
};

type QuizData = {
  weekId: string;
  categories: Category[];
};

async function getWixUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("rupsy_token")?.value ?? null;
  if (!token) return null;

  const secret = process.env.INTERNAL_WIX_SECRET;
  if (!secret) return null;

  try {
    const decoded = jwt.verify(token, secret) as { wixUserId?: string };
    return decoded.wixUserId ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const wixUserId = await getWixUserId();
    if (!wixUserId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const admin = await isAdmin(wixUserId);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    let body: QuizData;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON" },
        { status: 400 }
      );
    }

    const { weekId, categories } = body;
    if (!weekId || !Array.isArray(categories)) {
      return NextResponse.json(
        { success: false, message: "Invalid quiz data" },
        { status: 400 }
      );
    }

    const now = new Date();
    const endsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const weeklyQuizCategories: { categoryId: string; name: string; questionIds: string[] }[] = [];

    for (const cat of categories) {
      const categoryRef = db.collection("categories").doc();
      const categoryId = categoryRef.id;
      const questionIds: string[] = [];

      for (const q of cat.questions) {
        const questionRef = db.collection("questions").doc();
        const questionId = questionRef.id;
        questionIds.push(questionId);

        await questionRef.set({
          text: q.text,
          type: q.type,
          imageUrl: q.imageUrl ?? null,
          answers: q.answers,
          correctIndex: q.correctIndex,
          timeLimitSec: q.timeLimitSec,
          categoryId,
          weekId,
        });
      }

      await categoryRef.set({
        name: cat.name,
        questionIds,
        weekId,
      });

      weeklyQuizCategories.push({
        categoryId,
        name: cat.name,
        questionIds,
      });
    }

    await db.collection("weeklyQuiz").doc(weekId).set({
      weekId,
      categories: weeklyQuizCategories,
      startsAt: now,
      endsAt,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("publish-quiz error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
