import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import {
  login as authLogin,
  signup as authSignup,
  logout as authLogout,
  googleSignIn as authGoogleSignIn,
} from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Flag to prevent onAuthStateChanged from double-syncing when we've already
  // done it manually inside login / signup / googleSignIn.
  const manualAuthInProgress = useRef(false);

  // ── Core: Firebase user → backend JWT sync ─────────────────────────────────
  const syncBackend = async (firebaseUser) => {
    try {
      // Fetch existing data from Firestore just in case this is an old account
      // that is not synced to MongoDB yet
      let isProfileSetupFromFirestore = false;
      let existingData = {};
      try {
        if (db) {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            existingData = docSnap.data();
            isProfileSetupFromFirestore = existingData.isProfileSetup || false;
          }
        }
      } catch (fsErr) {
        console.warn('Firestore fetch skipped/failed:', fsErr.message);
      }

      const cachedSetup = localStorage.getItem('isProfileSetup') === 'true';
      const finalIsProfileSetup = isProfileSetupFromFirestore || cachedSetup;

      // Self-heal Firestore if it was missing the flag but we know it's setup
      if (finalIsProfileSetup && !isProfileSetupFromFirestore && db) {
        setDoc(doc(db, 'users', firebaseUser.uid), { isProfileSetup: true }, { merge: true }).catch(() => {});
      }

      const activeRole = localStorage.getItem('role') || 'citizen';
      const payload = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: existingData.name || firebaseUser.displayName || 'Citizen',
        role: existingData.role || activeRole,
        isProfileSetup: finalIsProfileSetup,
        phone: existingData.phone || '',
        address: existingData.address || '',
        gender: existingData.gender || '',
        dob: existingData.dob || '',
        photo: existingData.photo || '',
        surname: existingData.surname || '',
        nagrikId: existingData.nagrikId || '',
        points: existingData.points || 0
      };

      const res = await fetch('/api/auth/firebase-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.data?.token) {
          localStorage.setItem('token', data.data.token);
        }
        return data?.data?.user || null;
      }
    } catch (err) {
      console.warn('Backend sync failed:', err);
    }
    return null;
  };

  // ── Build merged user object from Firebase + backend data ──────────────────
  const buildUser = (firebaseUser, backendUser) => {
    // When backendUser is null (sync failed/offline) or if the Render ephemeral backend 
    // wiped our localDb json file, fall back to the localStorage-cached isProfileSetup.
    const cachedSetup = localStorage.getItem('isProfileSetup') === 'true';
    const isProfileSetup = (backendUser && backendUser.isProfileSetup === true) || cachedSetup;

    // Persist a successful setup state so it survives backend-offline sessions
    if (isProfileSetup) {
      localStorage.setItem('isProfileSetup', 'true');
    }

    return {
      ...firebaseUser,
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      role: backendUser?.role || localStorage.getItem('role') || 'citizen',
      isProfileSetup,
      name: backendUser?.name || firebaseUser.displayName || 'Citizen',
      surname: backendUser?.surname || '',
      address: backendUser?.address || '',
      gender: backendUser?.gender || '',
      phone: backendUser?.phone || '',
      dob: backendUser?.dob || '',
      photo: backendUser?.photo || '',
      nagrikId: backendUser?.nagrikId || '',
      _id: backendUser?._id || backendUser?.id || null,
      points: backendUser?.points || 0,
    };
  };

  // ── Firebase auth state listener (page load / token refresh) ───────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Skip if we're already handling this via a manual login/signup/google call
      if (manualAuthInProgress.current) return;

      if (!firebaseUser) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setUser(null);
        setLoading(false);
        return;
      }

      if (!localStorage.getItem('role')) {
        localStorage.setItem('role', 'citizen');
      }

      const backendUser = await syncBackend(firebaseUser);
      setUser(buildUser(firebaseUser, backendUser));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ── Auth actions ───────────────────────────────────────────────────────────
  const login = async (email, password) => {
    setLoading(true);
    manualAuthInProgress.current = true;
    try {
      const cred = await authLogin(email, password);
      const backendUser = await syncBackend(cred.user);
      setUser(buildUser(cred.user, backendUser));
      return cred;
    } catch (error) {
      throw error;
    } finally {
      manualAuthInProgress.current = false;
      setLoading(false);
    }
  };

  const signup = async (name, email, password) => {
    setLoading(true);
    manualAuthInProgress.current = true;
    try {
      const cred = await authSignup(name, email, password);
      const backendUser = await syncBackend(cred.user);
      setUser(buildUser(cred.user, backendUser));
      return cred;
    } catch (error) {
      throw error;
    } finally {
      manualAuthInProgress.current = false;
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authLogout();
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('isProfileSetup');
      setUser(null);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const googleSignIn = async () => {
    setLoading(true);
    manualAuthInProgress.current = true;
    try {
      const cred = await authGoogleSignIn();
      const backendUser = await syncBackend(cred.user);
      setUser(buildUser(cred.user, backendUser));
      return cred;
    } catch (error) {
      throw error;
    } finally {
      manualAuthInProgress.current = false;
      setLoading(false);
    }
  };

  // ── Profile setup ──────────────────────────────────────────────────────────
  const setupProfile = async (formDataPayload) => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/auth/setup-profile', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formDataPayload,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to update profile');
    }

    const result = await res.json();
    const updatedUser = result.data.user;

    // ✅ IMMEDIATELY update user state — do NOT await Firestore (it can hang)
    localStorage.setItem('isProfileSetup', 'true');
    setUser((prev) => ({
      ...prev,
      ...updatedUser,
      isProfileSetup: true,
    }));

    // Fire-and-forget Firestore sync — never blocks navigation
    if (user?.uid && db) {
      setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          name: updatedUser.name,
          surname: updatedUser.surname || '',
          email: updatedUser.email,
          address: updatedUser.address || '',
          gender: updatedUser.gender || '',
          phone: updatedUser.phone || '',
          dob: updatedUser.dob || '',
          photo: updatedUser.photo || '',
          nagrikId: updatedUser.nagrikId || '',
          isProfileSetup: true,
          role: updatedUser.role || 'citizen',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch((fsErr) => console.warn('Firestore profile sync skipped:', fsErr.message));
    }

    return updatedUser;
  };

  const fetchMe = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const backendUser = data?.data?.user;
        if (backendUser) {
          setUser((prev) => {
            if (!prev) return buildUser({}, backendUser);
            if (
              prev.points === backendUser.points &&
              prev.isProfileSetup === backendUser.isProfileSetup &&
              prev.role === backendUser.role &&
              prev.name === backendUser.name
            ) {
              return prev;
            }
            return buildUser(prev, backendUser);
          });
          return backendUser;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch user profile:', err);
    }
    return null;
  }, []);

  const value = { user, loading, login, signup, logout, googleSignIn, setupProfile, fetchMe };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
