import { db } from "@/lib/firebaseAdmin";

export async function isAdmin(wixUserId: string): Promise<boolean> {
  const doc = await db.collection("admins").doc(wixUserId).get();
  return doc.exists;
}
