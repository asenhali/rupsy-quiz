import { initializeApp, getApps, cert, type App } from "firebase-admin/app";

export function initFirebaseAdmin(): App | null {
  if (getApps().length > 0) {
    return getApps()[0] as App;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\r/g, "");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}
