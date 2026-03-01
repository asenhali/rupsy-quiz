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

export async function GET(request: Request) {
  try {
    const auth = await getWixUserId();
    if ("error" in auth) return auth.error;
    const { wixUserId } = auth;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "city";

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
      if (type === "cities") {
        return NextResponse.json({ success: true, entries: [], userRank: null });
      }
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

    const userDoc = await db.collection("users").doc(wixUserId).get();
    const userCityRaw = userDoc.data()?.city ?? "";
    const userCityNorm = normalizeCity(userCityRaw);
    const userCityDisplay = userCityRaw.trim() || "Mesto";

    if (type === "city") {
      if (!userCityNorm) {
        return NextResponse.json({
          success: true,
          entries: [],
          userRank: null,
          cityName: "",
        });
      }
      const userIds = [...new Set(completedSessions.map((d) => d.data().userId as string))];
      const userDocs = await Promise.all(
        userIds.map((id) => db.collection("users").doc(id).get())
      );
      const userIdToUser = new Map<string, { nickname?: string; city?: string }>();
      userIds.forEach((id, i) => {
        const data = userDocs[i]?.data();
        userIdToUser.set(id, {
          nickname: data?.nickname,
          city: data?.city,
        });
      });

      const citySessions = completedSessions
        .map((doc) => {
          const d = doc.data();
          const city = normalizeCity(userIdToUser.get(d.userId as string)?.city ?? "");
          return { ...d, city } as { userId: string; totalScore: number; completedAt: unknown; city: string };
        })
        .filter((s) => normalizeCity(s.city ?? "") === userCityNorm);

      const sessionsWithData = citySessions.map((s): { userId: string; totalScore: number; completedAt: Date | unknown } => {
        let completedAt: Date | unknown = s.completedAt;
        if (s.completedAt && typeof s.completedAt === "object" && "toDate" in s.completedAt) {
          completedAt = (s.completedAt as { toDate: () => Date }).toDate();
        }
        return {
          userId: s.userId,
          totalScore: s.totalScore ?? 0,
          completedAt,
        };
      });

      sessionsWithData.sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        const aTime = a.completedAt instanceof Date ? a.completedAt.getTime() : 0;
        const bTime = b.completedAt instanceof Date ? b.completedAt.getTime() : 0;
        return aTime - bTime;
      });

      const top50 = sessionsWithData.slice(0, 50);
      const entries = top50.map((s, i) => {
        const u = userIdToUser.get(s.userId) ?? {};
        return {
          rank: i + 1,
          nickname: u.nickname ?? "—",
          city: u.city ?? userCityDisplay,
          score: s.totalScore,
          isCurrentUser: s.userId === wixUserId,
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
        cityName: userCityDisplay,
      });
    }

    if (type === "cities") {
      const userIds = [...new Set(completedSessions.map((d) => d.data().userId as string))];
      const userDocs = await Promise.all(
        userIds.map((id) => db.collection("users").doc(id).get())
      );
      const userIdToCity = new Map<string, string>();
      userIds.forEach((id, i) => {
        userIdToCity.set(id, userDocs[i]?.data()?.city ?? "");
      });

      const cityScores = new Map<string, number[]>();
      const cityDisplayMap = new Map<string, string>();
      completedSessions.forEach((doc) => {
        const data = doc.data();
        const rawCity = userIdToCity.get(data.userId as string) ?? "";
        const cityNorm = normalizeCity(rawCity);
        if (!cityNorm) return;
        const display = rawCity.trim() || "Mesto";
        if (!cityDisplayMap.has(cityNorm) || display !== "Mesto") {
          cityDisplayMap.set(cityNorm, display);
        }
        if (!cityScores.has(cityNorm)) cityScores.set(cityNorm, []);
        cityScores.get(cityNorm)!.push(data.totalScore ?? 0);
      });

      const cityEntries = [...cityScores.entries()].map(([cityNorm, scores]) => ({
        cityNorm,
        cityDisplay: cityDisplayMap.get(cityNorm) ?? cityNorm,
        scores,
      }));

      cityEntries.sort((a, b) => {
        const avgA = a.scores.reduce((x, y) => x + y, 0) / a.scores.length;
        const avgB = b.scores.reduce((x, y) => x + y, 0) / b.scores.length;
        if (avgB !== avgA) return avgB - avgA;
        if (b.scores.length !== a.scores.length) return b.scores.length - a.scores.length;
        return a.cityDisplay.localeCompare(b.cityDisplay);
      });

      const entries = cityEntries.map((e, i) => ({
        rank: i + 1,
        city: e.cityDisplay,
        averageScore: Math.round(
          e.scores.reduce((a, b) => a + b, 0) / e.scores.length
        ),
        playerCount: e.scores.length,
        isCurrentCity: e.cityNorm === userCityNorm,
      }));

      const userCityIdx = cityEntries.findIndex((e) => e.cityNorm === userCityNorm);
      const userRank =
        userCityIdx >= 0
          ? {
              rank: userCityIdx + 1,
              averageScore: Math.round(
                cityEntries[userCityIdx]!.scores.reduce((a, b) => a + b, 0) /
                  cityEntries[userCityIdx]!.scores.length
              ),
              playerCount: cityEntries[userCityIdx]!.scores.length,
            }
          : null;

      return NextResponse.json({
        success: true,
        entries,
        userRank,
      });
    }

    return NextResponse.json({ success: true, entries: [], userRank: null });
  } catch (err) {
    console.error("quiz leaderboard-city error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
