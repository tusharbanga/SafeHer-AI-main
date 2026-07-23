import { initializeApp, type FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCTA455KsowmZmdp3oNaprrv3ABTnQxhs0",
  authDomain: "she-her-ff420.firebaseapp.com",
  projectId: "she-her-ff420",
  storageBucket: "she-her-ff420.firebasestorage.app",
  messagingSenderId: "732623834122",
  appId: "1:732623834122:web:dad34b898102240f3ca3f3",
  measurementId: "G-PW3QEXFP4S",
};

let app: FirebaseApp | null = null;

export function getFirebaseApp() {
  if (typeof window === "undefined") {
    return null;
  }

  if (app) {
    return app;
  }

  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId || !firebaseConfig.appId) {
    return null;
  }

  app = initializeApp(firebaseConfig);
  return app;
}
