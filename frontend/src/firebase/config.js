import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Analytics is optional
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC4aurkqrZUG6CoVz07b6uUkRdZYyxq3Qk",
  authDomain: "lumeeducation-9da13.firebaseapp.com",
  projectId: "lumeeducation-9da13",
  storageBucket: "lumeeducation-9da13.firebasestorage.app",
  messagingSenderId: "846710827476",
  appId: "1:846710827476:web:104c32dca9bfaae51c4e41",
  measurementId: "G-T8V03292J8"
};

const app = initializeApp(firebaseConfig);

// Core services (IMPORTANT)
export const auth = getAuth(app);
export const db = getFirestore(app);

// Optional
export const analytics = getAnalytics(app);