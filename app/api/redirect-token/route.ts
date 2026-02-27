import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Missing token" },
      { status: 400 }
    );
  }

  const redirectUrl = new URL("/", request.url);
  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set("rupsy_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 2592000, // 30 days
  });

  return response;
}
