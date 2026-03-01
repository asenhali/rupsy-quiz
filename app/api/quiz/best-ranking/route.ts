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

function normalizeCity(city: string): string {
  return (city ?? "").trim().toLowerCase();
}

function computeRanks(
  userTotalScore: number,
  userCity: string,
  completedSessions: { userId: string; totalScore: number }[],
  userIdToCity: Map<string, string>
): { cityRank: number; slovakiaRank: number; citiesRank: number } {
  const slovakiaBetterCount = completedSessions.filter((s) => s.totalScore > userTotalScore).length;
  const slovakiaRank = slovakiaBetterCount + 1;

  const userCityNorm = normalizeCity(userCity);
  const sessionsInUserCity = completedSessions.filter((s) => {
    const city = normalizeCity(userIdToCity.get(s.userId) ?? "");
    return city === userCityNorm;
  });
  const cityBetterCount = sessionsInUserCity.filter((s) => s.totalScore > userTotalScore).length;
  const cityRank = sessionsInUserCity.length > 0 ? cityBetterCount + 1 : 0;

  const cityScores = new Map<string, number[]>();
  completedSessions.forEach((s) => {
    const city = normalizeCity(userIdToCity.get(s.userId) ?? "");
    if (!cityScores.has(city)) cityScores.set(city, []);
    cityScores.get(city)!.push(s.totalScore);
  });
  const cityAverages = new Map<string, number>();
  cityScores.forEach((scores, city) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    cityAverages.set(city, avg);
  });
  const userCityAvg = cityAverages.get(userCityNorm) ?? 0;
  const citiesWithHigherAvg = [...cityAverages.values()].filter((avg) => avg > userCityAvg);
  const citiesRank = citiesWithHigherAvg.length + 1;

  return { cityRank, slovakiaRank, citiesRank };
}

export async function GET() {
  try {
    const auth = await getWixUserId();
    if ("error" in auth) return auth.error;
    const { wixUserId } = auth;

    const userSessionsSnap = await db
      .collection("quizSessions")
      .where("userId", "==", wixUserId)
      .get();

    const completedUserSessions = userSessionsSnap.docs.filter(
      (doc) => doc.data().completedAt != null
    );

    if (completedUserSessions.length === 0) {
      return NextResponse.json({
        success: true,
        bestCityRank: null,
        bestCityWeek: null,
        bestSlovakiaRank: null,
        bestSlovakiaWeek: null,
        bestCitiesRank: null,
        bestCitiesWeek: null,
      });
    }

    const weekIds = [...new Set(completedUserSessions.map((d) => d.data().weekId as string))];

    let bestCityRank: number | null = null;
    let bestCityWeek: string | null = null;
    let bestSlovakiaRank: number | null = null;
    let bestSlovakiaWeek: string | null = null;
    let bestCitiesRank: number | null = null;
    let bestCitiesWeek: string | null = null;

    const userDoc = await db.collection("users").doc(wixUserId).get();
    const userCity = userDoc.data()?.city ?? "";

    for (const weekId of weekIds) {
      const userSession = completedUserSessions.find((d) => d.data().weekId === weekId);
      if (!userSession) continue;
      const userTotalScore = userSession.data().totalScore ?? 0;

      const allSessionsSnap = await db
        .collection("quizSessions")
        .where("weekId", "==", weekId)
        .get();

      const completedSessions = allSessionsSnap.docs
        .filter((doc) => doc.data().completedAt != null)
        .map((doc) => {
          const d = doc.data();
          return { userId: d.userId as string, totalScore: d.totalScore ?? 0 };
        });

      const userIds = [...new Set(completedSessions.map((s) => s.userId))];
      const userDocs = await Promise.all(
        userIds.map((id) => db.collection("users").doc(id).get())
      );
      const userIdToCity = new Map<string, string>();
      userIds.forEach((id, i) => {
        userIdToCity.set(id, userDocs[i]?.data()?.city ?? "");
      });

      const { cityRank, slovakiaRank, citiesRank } = computeRanks(
        userTotalScore,
        userCity,
        completedSessions,
        userIdToCity
      );

      if (cityRank > 0 && (bestCityRank == null || cityRank < bestCityRank)) {
        bestCityRank = cityRank;
        bestCityWeek = weekId;
      }
      if (bestSlovakiaRank == null || slovakiaRank < bestSlovakiaRank) {
        bestSlovakiaRank = slovakiaRank;
        bestSlovakiaWeek = weekId;
      }
      if (bestCitiesRank == null || citiesRank < bestCitiesRank) {
        bestCitiesRank = citiesRank;
        bestCitiesWeek = weekId;
      }
    }

    return NextResponse.json({
      success: true,
      bestCityRank,
      bestCityWeek,
      bestSlovakiaRank,
      bestSlovakiaWeek,
      bestCitiesRank,
      bestCitiesWeek,
    });
  } catch (err) {
    console.error("quiz best-ranking error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
