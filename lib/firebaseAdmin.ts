import admin from "firebase-admin";

if (!admin.apps.length) {
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (base64) {
    const parsedServiceAccount = JSON.parse(
      Buffer.from(base64, "base64").toString("utf-8")
    );
    admin.initializeApp({
      credential: admin.credential.cert(parsedServiceAccount),
    });
  }
}

export const db = admin.firestore();
