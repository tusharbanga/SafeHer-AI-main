import { onAuthStateChanged, getAuth, signInWithPopup, GoogleAuthProvider, signOut, type User as FirebaseUser } from "firebase/auth";
import { getFirebaseApp } from "./firebase";
import { authApi, getStoredToken, saveAuthSession, clearAuthSession } from "./api";

const firebaseApp = getFirebaseApp();
const auth = firebaseApp ? getAuth(firebaseApp) : null;

export type UserSession = {
  uid: string;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
  accessToken?: string | null;
};

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export async function firebaseSignInWithGoogle() {
  if (!auth) {
    throw new Error("Firebase is not initialized.");
  }

  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();
  const response = await authApi.firebaseAuthenticate({ idToken });
  saveAuthSession(response.data);
  return response.data;
}

export async function firebaseSignOut() {
  if (auth) {
    await signOut(auth).catch(() => null);
  }
  clearAuthSession();
}

export async function resolveFirebaseAuthState(timeoutMs = 3000): Promise<FirebaseUser | null> {
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;

  return new Promise((resolve) => {
    let settled = false;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (settled) return;
      settled = true;
      unsubscribe();
      resolve(user);
    });

    window.setTimeout(() => {
      if (settled) return;
      settled = true;
      unsubscribe();
      resolve(auth.currentUser);
    }, timeoutMs);
  });
}

export async function getValidSessionToken() {
  const token = getStoredToken();
  if (token) return token;

  if (!auth) return null;
  const firebaseUser = await resolveFirebaseAuthState();
  if (!firebaseUser) return null;

  const idToken = await firebaseUser.getIdToken();
  const response = await authApi.firebaseAuthenticate({ idToken });
  saveAuthSession(response.data);
  return response.data.accessToken;
}

export function subscribeToAuthStateChange(onChanged: (user: UserSession | null) => void) {
  if (!auth) {
    onChanged(getStoredUser());
    return () => undefined;
  }

  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      clearAuthSession();
      onChanged(null);
      return;
    }

    try {
      const idToken = await user.getIdToken();
      const response = await authApi.firebaseAuthenticate({ idToken });
      saveAuthSession(response.data);
      onChanged(response.data);
    } catch (error) {
      console.error("Firebase auth sync failed", error);
      clearAuthSession();
      onChanged(null);
    }
  });
}

export function getFirebaseToken() {
  return auth ? auth.currentUser?.getIdToken() : Promise.resolve(null);
}

export const isAuthenticated = () => Boolean(getStoredToken());
