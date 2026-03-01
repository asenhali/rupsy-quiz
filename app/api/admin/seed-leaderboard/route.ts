// TEMPORARY: Testing endpoint for leaderboard. Delete later.
import { NextResponse } from "next/server";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { db } from "@/lib/firebaseAdmin";
import { SLOVAK_CITIES } from "@/config/cities";

const SLOVAK_NICKNAMES = [
  "Peter", "Ján", "Martin", "Marek", "Jakub", "Lukáš", "Tomáš", "Michal",
  "Adam", "Filip", "Kristián", "Samuel", "Denis", "Dávid", "Ondrej",
  "Eva", "Mária", "Anna", "Zuzana", "Jana", "Martina", "Lucia", "Veronika",
  "Kristína", "Barbora", "Sofía", "Emma", "Tereza", "Viktória", "Natália",
  "Dominik", "Matúš", "Simon", "Patrik", "Daniel", "Jakub", "Róbert",
  "Miroslav", "Branislav", "Pavol", "Jozef", "Andrej", "Roman", "Ivan",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("secret") !== "rupsy-test") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    let body: { count?: number } = {};
    try {
      body = await request.json().catch(() => ({}));
    } catch {
      // ignore
    }
    const count = typeof body.count === "number" && body.count > 0 ? body.count : 45;

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
        { success: false, message: "No active quiz" },
        { status: 404 }
      );
    }

    const quizData = activeQuiz.data();
    const weekId = quizData.weekId ?? activeQuiz.id;

    // Generate scores spread out 200-1050, descending for realistic leaderboard
    const scores: number[] = [];
    for (let i = 0; i < count; i++) {
      scores.push(randomInt(200, 1050));
    }
    scores.sort((a, b) => b - a);

    const fewHoursAgo = now.getTime() - 4 * 60 * 60 * 1000;

    for (let i = 0; i < count; i++) {
      const wixUserId = `fake_user_${Date.now()}_${i}`;
      const score = scores[i]!;
      const totalCorrect = randomInt(0, 25);
      const city = pick(SLOVAK_CITIES);
      const finishedAt = new Date(randomInt(fewHoursAgo, now.getTime()));
      const startedAt = new Date(finishedAt.getTime() - randomInt(60, 180) * 1000);
      const averageTime = randomInt(3000, 8000);
      const rupsyId = `FAKE-${String(i + 1).padStart(5, "0")}`;

      await db.collection("users").doc(wixUserId).set({
        wixUserId,
        rupsyId,
        nickname: pick(SLOVAK_NICKNAMES),
        city,
        avatarId: "default",
        totalXP: 0,
        level: 1,
        totalPoints: score,
        totalGames: 1,
        totalCorrect,
        rCoins: 0,
        createdAt: startedAt,
      });

      const answers = Array.from({ length: 25 }, (_, j) => ({
        questionId: `fake_q_${j}`,
        selectedIndex: 0,
        timeMs: averageTime + randomInt(-500, 500),
        points: j < totalCorrect ? randomInt(30, 40) : 0,
        correct: j < totalCorrect,
      }));

      await db.collection("quizSessions").add({
        userId: wixUserId,
        weekId,
        totalScore: score,
        answers,
        completedAt: finishedAt,
        startedAt,
        currentQuestionIndex: 25,
      });
    }

    return NextResponse.json({ created: count });
  } catch (err) {
    console.error("seed-leaderboard error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
