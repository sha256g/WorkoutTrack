import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";
import { firebaseApp } from "./firebase";

const auth = getAuth(firebaseApp);
const provider = new GoogleAuthProvider();

export function signInWithGoogle() {
  return signInWithPopup(auth, provider);
}

export function signOutUser() {
  return signOut(auth);
}

export function onUserChanged(callback) {
  return onAuthStateChanged(auth, callback);
}

export { auth }; 