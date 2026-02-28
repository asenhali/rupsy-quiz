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

function normalizeCity(city: string): string {
  return (city ?? "").trim().toLowerCase();
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
      return NextResponse.json({ success: true, ranking: null });
    }

    const quizData = activeQuiz.data();
    const weekId = quizData.weekId ?? activeQuiz.id;

    const userSessionSnap = await db
      .collection("quizSessions")
      .where("userId", "==", wixUserId)
      .where("weekId", "==", weekId)
      .limit(1)
      .get();

    if (userSessionSnap.empty || userSessionSnap.docs[0].data().completedAt == null) {
      return NextResponse.json({ success: true, ranking: null });
    }

    const userSessionData = userSessionSnap.docs[0].data();
    const totalScore = userSessionData.totalScore ?? 0;

    const allSessionsSnap = await db
      .collection("quizSessions")
      .where("weekId", "==", weekId)
      .get();

    const completedSessions = allSessionsSnap.docs.filter((doc) => doc.data().completedAt != null);
    const slovakiaTotal = completedSessions.length;

    let slovakiaBetterCount = 0;
    completedSessions.forEach((doc) => {
      const data = doc.data();
      if ((data.totalScore ?? 0) > totalScore) slovakiaBetterCount++;
    });
    const slovakiaRank = slovakiaBetterCount + 1;

    const userIds = [...new Set(completedSessions.map((d) => d.data().userId as string))];
    const userDocs = await Promise.all(userIds.map((id) => db.collection("users").doc(id).get()));
    const userIdToCity = new Map<string, string>();
    userDocs.forEach((doc, i) => {
      userIdToCity.set(userIds[i], doc.data()?.city ?? "");
    });

    const userDoc = await db.collection("users").doc(wixUserId).get();
    const userCity = normalizeCity(userDoc.data()?.city ?? "");
    const cityName = (userDoc.data()?.city ?? "").trim() || "Mesto";

    const sessionsInUserCity = completedSessions.filter((doc) => {
      const city = normalizeCity(userIdToCity.get(doc.data().userId) ?? "");
      return city === userCity;
    });
    const cityTotal = sessionsInUserCity.length;

    let cityBetterCount = 0;
    sessionsInUserCity.forEach((doc) => {
      const data = doc.data();
      if ((data.totalScore ?? 0) > totalScore) cityBetterCount++;
    });
    const cityRank = cityTotal > 0 ? cityBetterCount + 1 : 0;

    const cityScores = new Map<string, number[]>();
    completedSessions.forEach((doc) => {
      const data = doc.data();
      const city = normalizeCity(userIdToCity.get(data.userId) ?? "");
      if (!cityScores.has(city)) cityScores.set(city, []);
      cityScores.get(city)!.push(data.totalScore ?? 0);
    });

    const cityAverages = new Map<string, number>();
    cityScores.forEach((scores, city) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      cityAverages.set(city, avg);
    });

    const userCityAvg = cityAverages.get(userCity) ?? 0;
    const citiesWithHigherAvg = [...cityAverages.entries()].filter(([, avg]) => avg > userCityAvg);
    const citiesRank = citiesWithHigherAvg.length + 1;
    const citiesTotal = cityAverages.size;

    return NextResponse.json({
      success: true,
      ranking: {
        totalScore,
        slovakiaRank,
        slovakiaTotal,
        cityRank,
        cityTotal,
        cityName,
        citiesRank,
        citiesTotal,
      },
    });
  } catch (err) {
    console.error("quiz my-ranking error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
