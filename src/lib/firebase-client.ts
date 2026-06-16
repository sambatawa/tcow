import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_APIKEY!,
  authDomain: process.env.FIREBASE_AUTHDOMAIN!,
  projectId: process.env.FIREBASE_PROJECTID!,
  storageBucket: process.env.FIREBASE_STORAGEBUCKET!,
  messagingSenderId: process.env.FIREBASE_MESSAGINGSENDERID!,
  appId: process.env.FIREBASE_APPID!,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGooglePopup(): Promise<string> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user.getIdToken();
}

export async function firebaseSignOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch {
  }
}