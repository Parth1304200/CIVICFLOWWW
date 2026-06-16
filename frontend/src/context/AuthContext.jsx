import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
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
      const activeRole = localStorage.getItem('role') || 'citizen';
      const res = await fetch('/api/auth/firebase-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || 'Citizen',
          role: activeRole,
        }),
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
  const buildUser = (firebaseUser, backendUser) => ({
    ...firebaseUser,
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    role: backendUser?.role || localStorage.getItem('role') || 'citizen',
    // Strict boolean — absence of field means NOT set up
    isProfileSetup: backendUser?.isProfileSetup === true,
    name: backendUser?.name || firebaseUser.displayName || 'Citizen',
    surname: backendUser?.surname || '',
    address: backendUser?.address || '',
    gender: backendUser?.gender || '',
    phone: backendUser?.phone || '',
    dob: backendUser?.dob || '',
    photo: backendUser?.photo || '',
    nagrikId: backendUser?.nagrikId || '',
    _id: backendUser?._id || backendUser?.id || null,
  });

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

  const value = { user, loading, login, signup, logout, googleSignIn, setupProfile };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
