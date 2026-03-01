// TEMPORARY: Cleanup endpoint for fake users. Delete along with seed-leaderboard.
import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

const PREFIX = "fake_user_";
const PREFIX_END = "fake_user_\uf8ff";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("secret") !== "rupsy-test") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    let totalDeleted = 0;

    const usersSnap = await db
      .collection("users")
      .where("wixUserId", ">=", PREFIX)
      .where("wixUserId", "<", PREFIX_END)
      .get();

    const batchSize = 500;
    const userBatches: FirebaseFirestore.DocumentSnapshot[][] = [];
    for (let i = 0; i < usersSnap.docs.length; i += batchSize) {
      userBatches.push(usersSnap.docs.slice(i, i + batchSize));
    }
    for (const batch of userBatches) {
      const writeBatch = db.batch();
      for (const doc of batch) {
        writeBatch.delete(doc.ref);
      }
      await writeBatch.commit();
      totalDeleted += batch.length;
    }

    const quizSessionsSnap = await db
      .collection("quizSessions")
      .where("userId", ">=", PREFIX)
      .where("userId", "<", PREFIX_END)
      .get();

    const quizSessionBatches: FirebaseFirestore.DocumentSnapshot[][] = [];
    for (let i = 0; i < quizSessionsSnap.docs.length; i += batchSize) {
      quizSessionBatches.push(quizSessionsSnap.docs.slice(i, i + batchSize));
    }
    for (const batch of quizSessionBatches) {
      const writeBatch = db.batch();
      for (const doc of batch) {
        writeBatch.delete(doc.ref);
      }
      await writeBatch.commit();
      totalDeleted += batch.length;
    }

    const weeklyScoresSnap = await db
      .collection("weeklyScores")
      .where("wixUserId", ">=", PREFIX)
      .where("wixUserId", "<", PREFIX_END)
      .get();

    const weeklyScoresBatches: FirebaseFirestore.DocumentSnapshot[][] = [];
    for (let i = 0; i < weeklyScoresSnap.docs.length; i += batchSize) {
      weeklyScoresBatches.push(weeklyScoresSnap.docs.slice(i, i + batchSize));
    }
    for (const batch of weeklyScoresBatches) {
      const writeBatch = db.batch();
      for (const doc of batch) {
        writeBatch.delete(doc.ref);
      }
      await writeBatch.commit();
      totalDeleted += batch.length;
    }

    return NextResponse.json({ deleted: totalDeleted });
  } catch (err) {
    console.error("clear-fake-users error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
