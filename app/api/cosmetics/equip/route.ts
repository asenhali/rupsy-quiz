import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/lib/firebaseAdmin";
import {
  getCosmeticById,
  DEFAULT_ITEM_IDS,
  type CosmeticType,
} from "@/lib/cosmetics";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    let token =
      authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get("rupsy_token")?.value ?? null;
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const secret = process.env.INTERNAL_WIX_SECRET;
    if (!secret) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    let decoded: { wixUserId: string };
    try {
      decoded = jwt.verify(token, secret) as { wixUserId: string };
    } catch (err) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!decoded.wixUserId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    let body: { type?: unknown; itemId?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid body" },
        { status: 400 }
      );
    }

    const rawType = body.type;
    const rawItemId = body.itemId;

    const validTypes: CosmeticType[] = [
      "nameColor",
      "avatar",
      "avatarFrame",
      "avatarBackground",
    ];
    if (typeof rawType !== "string" || !validTypes.includes(rawType as CosmeticType)) {
      return NextResponse.json(
        { success: false, message: "Invalid type" },
        { status: 400 }
      );
    }

    const type = rawType as CosmeticType;

    if (rawItemId !== null && (typeof rawItemId !== "string" || !rawItemId.trim())) {
      return NextResponse.json(
        { success: false, message: "Invalid itemId" },
        { status: 400 }
      );
    }

    const itemId = rawItemId === null ? null : (rawItemId as string).trim();

    const userRef = db.collection("users").doc(decoded.wixUserId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const data = userDoc.data();
    const ownedItems: string[] = data?.ownedItems ?? [];

    let valueToStore: string | null = itemId;

    if (itemId !== null) {
      const item = getCosmeticById(itemId);
      if (!item || item.type !== type) {
        return NextResponse.json(
          { success: false, message: "Invalid item" },
          { status: 400 }
        );
      }
      const isDefault = DEFAULT_ITEM_IDS[type] === itemId;
      if (!isDefault && !ownedItems.includes(itemId)) {
        return NextResponse.json(
          { success: false, message: "You do not own this item" },
          { status: 403 }
        );
      }
      if (type === "avatar") {
        valueToStore = item.value;
      } else if (isDefault) {
        valueToStore = null;
      }
    } else if (type === "avatar") {
      valueToStore = "default";
    }

    const fieldMap = {
      nameColor: "equippedNameColor",
      avatar: "equippedAvatar",
      avatarFrame: "equippedAvatarFrame",
      avatarBackground: "equippedAvatarBackground",
    } as const;

    const field = fieldMap[type];
    await userRef.update({ [field]: valueToStore });

    return NextResponse.json({
      success: true,
      equipped: itemId,
    });
  } catch (err) {
    console.error("cosmetics/equip error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
