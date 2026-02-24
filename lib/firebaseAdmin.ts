import { initializeApp, getApps, cert, type App } from "firebase-admin/app";

export function initFirebaseAdmin(): App | null {
  if (getApps().length > 0) {
    return getApps()[0] as App;
  }

  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!base64) return null;

  const json = JSON.parse(
    Buffer.from(base64, "base64").toString("utf-8")
  );

  return initializeApp({
    credential: cert(json),
  });
}
