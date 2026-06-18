import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function CMLogin() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    if (email !== 'rekha@gupta.com' || password !== 'Rekha@1234#') {
      setError('Invalid CM credentials.');
      return;
    }

    setLoading(true);
    try {
      localStorage.setItem('role', 'cm');
      try {
        await login(email, password);
      } catch (err) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          await signup('Rekha Gupta', email, password);
        } else {
          throw err;
        }
      }
      navigate('/cm-dashboard');
    } catch (err) {
      setError('Failed to authenticate CM.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="relative z-10 mx-auto w-full max-w-[90%] sm:max-w-md">
        <Link 
          to="/" 
          className="absolute -top-12 left-4 sm:-left-12 sm:top-2 flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Back to Home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <div className="flex justify-center mb-6">
          <img 
            src="/logo-clean.png" 
            alt="Civic Flow Logo" 
            className="h-20 object-contain brightness-0 invert"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="hidden h-16 items-center justify-center text-3xl font-bold text-white">
            CIVIC FLOW
          </div>
        </div>
        <h2 className="mt-2 text-center text-2xl sm:text-3xl font-extrabold text-white mb-2">
          CM Dashboard Portal
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400 mb-8">
          Secure Chief Minister Login
        </p>

        <div className="bg-white py-6 px-6 shadow-sm border border-slate-200 rounded-xl sm:rounded-xl sm:px-10">
          {error && (
            <div className="mb-6 bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email ID</label>
              <input
                name="email"
                type="text"
                required
                className="block w-full appearance-none rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="rekha@gupta.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                name="password"
                type="password"
                required
                className="block w-full appearance-none rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-lg border border-transparent bg-blue-600 py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Authenticating...' : 'Sign In as CM'}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
