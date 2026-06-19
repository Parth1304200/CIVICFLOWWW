import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const provider = new GoogleAuthProvider();

/**
 * Sign up with email/password.
 * Returns a UserCredential-shaped object: { user }
 */
export const signup = async (name, email, password) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  // Persist the display name on the Firebase Auth profile
  try {
    await updateProfile(credential.user, { displayName: name });
  } catch (e) {
    console.warn('updateProfile skipped:', e.message);
  }

  // Background Firestore sync — non-blocking
  const userDocRef = doc(db, 'users', credential.user.uid);
  setDoc(userDocRef, {
    uid: credential.user.uid,
    name,
    email,
    role: 'citizen',
    createdAt: new Date().toISOString(),
  }).catch((err) => console.warn('Background Firestore sync skipped:', err));

  // Return the full UserCredential so callers can do cred.user
  return credential;
};

/**
 * Sign in with email/password.
 * Returns a UserCredential: { user }
 */
export const login = async (email, password) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential; // { user, ... }
};

/**
 * Sign out.
 */
export const logout = async () => signOut(auth);

import { signInWithRedirect } from 'firebase/auth';

/**
 * Google Sign-In redirect.
 * This will navigate away from the page.
 */
export const googleSignIn = async () => {
  await signInWithRedirect(auth, provider);
};

/**
 * Fetch Firestore user document (with 3 s timeout guard).
 */
export const getUserData = async (uid) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await Promise.race([
      getDoc(userDocRef),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore timeout')), 3000)
      ),
    ]);
    return snap?.exists() ? snap.data() : null;
  } catch (err) {
    console.warn('getUserData aborted:', err.message);
    return null;
  }
};
