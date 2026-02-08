import * as admin from 'firebase-admin';

let firestore: admin.firestore.Firestore | null = null;

export function getFirestore(): admin.firestore.Firestore {
  if (!firestore) {
    if (!admin.apps.length) {
      const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (keyPath) {
        admin.initializeApp({ credential: admin.credential.cert(keyPath) });
      } else {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        if (projectId && clientEmail && privateKey) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          });
        } else {
          admin.initializeApp();
        }
      }
    }
    firestore = admin.firestore();
  }
  return firestore;
}
