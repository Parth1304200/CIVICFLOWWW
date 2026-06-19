import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, CheckCircle2, Circle, ShieldCheck } from 'lucide-react';
import { getRedirectResult } from 'firebase/auth';
import { auth } from '../firebase/config';

// Password strength checker
function getStrength(password) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return { checks, passed, score: passed };
}

const STRENGTH_LABELS = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const STRENGTH_COLORS = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-emerald-500'];
const STRENGTH_TEXT = ['', 'text-red-600', 'text-orange-600', 'text-yellow-600', 'text-blue-600', 'text-emerald-600'];

function PasswordStrengthMeter({ password }) {
  if (!password) return null;
  const { checks, score } = getStrength(password);

  const rules = [
    { key: 'length',    label: 'At least 8 characters' },
    { key: 'uppercase', label: 'One uppercase letter (A–Z)' },
    { key: 'lowercase', label: 'One lowercase letter (a–z)' },
    { key: 'number',    label: 'One number (0–9)' },
    { key: 'special',   label: 'One special character (!@#$…)' },
  ];

  return (
    <div className="mt-2.5 space-y-2">
      {/* Bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? STRENGTH_COLORS[score] : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-bold ${STRENGTH_TEXT[score]}`}>
        {STRENGTH_LABELS[score]}
      </p>
      {/* Checklist */}
      <ul className="space-y-1">
        {rules.map(({ key, label }) => (
          <li key={key} className="flex items-center gap-1.5 text-xs">
            {checks[key] ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
            )}
            <span className={checks[key] ? 'text-slate-500 line-through' : 'text-slate-500'}>
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Register() {
  const navigate = useNavigate();
  const { signup, googleSignIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roleTab] = useState('citizen');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      if (err.code === 'auth/unauthorized-domain') {
        setError('Google Sign-In blocked: Domain not authorized in Firebase Console.');
      } else {
        setError(err.message || 'Google sign-up failed.');
      }
    });
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    const name = e.target.name.value.trim();
    const email = e.target.email.value.trim();

    // Client-side strength gate
    const { score } = getStrength(password);
    if (score < 3) {
      setError('Password is too weak. Please meet at least 3 of the 5 security requirements.');
      return;
    }

    setLoading(true);
    try {
      localStorage.setItem('role', roleTab);
      await signup(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      localStorage.setItem('role', roleTab);
      await googleSignIn();
      // Won't run because of redirect
    } catch (err) {
      setError(err.message || 'Google sign-up failed.');
    }
  };

  const { score } = getStrength(password);
  const isPasswordStrong = score >= 3;

  return (
    <div className="min-h-screen flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/bg-login.jpg"
          alt="Delhi Background"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://www.mistay.in/travel-blog/content/images/2020/06/humayuns-tomb.jpg';
          }}
        />
        <div className="absolute inset-0 bg-slate-900/40"></div>
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md w-full">
        <Link
          to="/"
          className="absolute -top-12 left-0 sm:-left-12 sm:top-2 flex items-center justify-center h-10 w-10 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors shadow-sm"
          title="Back to Home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m15 18-6-6 6-6" /></svg>
        </Link>
        <div className="flex justify-center mb-4">
          <img 
            src="/logo-clean.png" 
            alt="Civic Flow Logo" 
            className="h-12 object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="hidden h-12 items-center justify-center text-xl font-bold text-white">
            CIVIC FLOW
          </div>
        </div>
        
        <div className="bg-white/90 backdrop-blur-xl py-6 px-5 shadow-2xl border border-white/20 rounded-2xl sm:px-8 w-full">
          <h2 className="text-center text-xl font-extrabold text-slate-900 mb-1">
            Create your account
          </h2>
          <p className="text-center text-xs text-slate-600 mb-4">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500 transition-colors">
              Sign in
            </Link>
          </p>

          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs flex items-start gap-2">
              <span className="text-red-400 mt-0.5">⚠</span>
              {error}
            </div>
          )}

          {/* Google Sign-up */}
          <div className="mb-4">
            <Button variant="secondary" onClick={handleGoogle} className="w-full flex justify-center gap-2 items-center py-2 text-sm">
              <svg className="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26537 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
              </svg>
              Sign up with Google
            </Button>
            <div className="mt-4 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
              <div className="px-3 text-xs text-slate-500 whitespace-nowrap">Or continue with email</div>
              <div className="w-full border-t border-slate-200"></div>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleRegister}>
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-slate-700">Full Name</label>
              <div className="mt-1">
                <Input id="name" name="name" type="text" autoComplete="name" placeholder="Your full name" required className="py-1.5 text-sm" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-700">Email address</label>
              <div className="mt-1">
                <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required className="py-1.5 text-sm" />
              </div>
            </div>

            {/* Password with strength meter */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                  className="flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 pr-10 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Live strength meter */}
              <PasswordStrengthMeter password={password} />

              {/* Security banner when strong */}
              {isPasswordStrong && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
                  Password meets security requirements
                </div>
              )}
            </div>

            <div className="pt-1">
              <Button
                type="submit"
                className="w-full py-2 text-sm"
                isLoading={loading}
                disabled={loading || !isPasswordStrong}
              >
                Create Account
              </Button>
              {!isPasswordStrong && password.length > 0 && (
                <p className="text-[10px] text-center text-slate-400 mt-2">
                  Strengthen your password to enable account creation
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
