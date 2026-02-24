import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export async function POST(request: Request) {
  try {
    const secret = request.headers.get("x-internal-secret");
    const expectedSecret = process.env.INTERNAL_WIX_SECRET;

    if (!secret || !expectedSecret || secret !== expectedSecret) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { wixUserId } = body;

    if (!wixUserId || typeof wixUserId !== "string") {
      return NextResponse.json(
        { success: false, error: "wixUserId is required" },
        { status: 400 }
      );
    }

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("wixUserId", "==", wixUserId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({
        success: true,
        needsOnboarding: true,
      });
    }

    const userDoc = querySnapshot.docs[0];
    const userData = {
      id: userDoc.id,
      ...userDoc.data(),
    };

    return NextResponse.json({
      success: true,
      needsOnboarding: false,
      user: userData,
    });
  } catch (error) {
    console.error("auth-from-wix error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
