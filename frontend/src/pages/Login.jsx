import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { Shield, User } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const { login, signup, googleSignIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
      localStorage.setItem('role', 'citizen');
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      localStorage.setItem('role', 'citizen');
      await googleSignIn();
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/unauthorized-domain') {
        setError('Google Sign-In blocked: Domain not authorized. Add your domain in Firebase Console -> Authentication -> Settings -> Authorized Domains.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup closed before completing.');
      } else {
        setError(err.message || 'Google sign-in failed');
      }
    }
  };

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
            Citizen Login
          </h2>
          <p className="text-center text-xs text-slate-600 mb-4">
            Or{' '}
            <Link to="/register" className="font-bold text-blue-600 hover:text-blue-500 transition-colors">
              create a new account
            </Link>
          </p>

          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          <div className="mb-4">
            <Button variant="secondary" onClick={handleGoogle} className="w-full flex justify-center gap-2 items-center py-2 text-sm">
              <svg className="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26537 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
              </svg>
              Sign in with Google
            </Button>
            <div className="mt-4 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
              <div className="px-3 text-xs text-slate-500 whitespace-nowrap">Or continue with email</div>
              <div className="w-full border-t border-slate-200"></div>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-700">
                Email address
              </label>
              <div className="mt-1">
                <Input id="email" name="email" type="email" autoComplete="email" required className="py-1.5 text-sm" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-700">
                Password
              </label>
              <div className="mt-1">
                <Input id="password" name="password" type="password" autoComplete="current-password" required className="py-1.5 text-sm" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-900">
                  Remember me
                </label>
              </div>

              <div className="text-xs">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full py-2 text-sm" isLoading={loading}>
                Sign in
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
