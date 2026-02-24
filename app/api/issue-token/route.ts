import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

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

    const token = jwt.sign(
      { wixUserId },
      expectedSecret,
      { expiresIn: "2h" }
    );

    return NextResponse.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error("issue-token error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
