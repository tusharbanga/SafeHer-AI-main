const admin = require("firebase-admin");

let firebaseApp = null;

/**
 * Lazily initializes the Firebase Admin SDK for Firebase Cloud Messaging (FCM).
 * Returns null (instead of throwing) when credentials are not configured so
 * that the rest of the API keeps working in environments without FCM set up.
 */
const getFirebaseApp = () => {
  if (firebaseApp) return firebaseApp;

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.warn("Firebase credentials not set — push notifications are disabled.");
    return null;
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });

  return firebaseApp;
};

module.exports = { getFirebaseApp, admin };
