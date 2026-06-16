'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      email: form.email.trim().toLowerCase(),
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error === 'CredentialsSignin'
        ? 'Invalid email or password.'
        : res.error);
      return;
    }

    // Redirect based on role — we fetch session to get role
    const sessionRes = await fetch('/api/auth/session');
    const session = await sessionRes.json();
    const role = session?.user?.role;

    if (role === 'cm') router.push('/cm/dashboard');
    else if (role === 'admin') router.push('/secretariat/dashboard');
    else if (role === 'officer') router.push('/secretariat/dashboard');
    else router.push('/citizen/dashboard');
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">🏛️</div>
          <div>
            <p className="text-white font-bold text-sm">Delhi CMO</p>
            <p className="text-blue-200 text-xs">Grievance Portal</p>
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Government that<br />listens. Officers that<br />act.
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed max-w-sm">
            Real-time complaint tracking, anti-corruption safeguards, and full transparency
            at every step of the grievance process.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { v: '91%', l: 'Resolved' },
              { v: '48h', l: 'Avg. Time' },
              { v: '4.2★', l: 'Rating' },
            ].map(s => (
              <div key={s.l} className="p-3 rounded-xl bg-white/10 border border-white/10">
                <p className="text-white font-bold text-lg">{s.v}</p>
                <p className="text-blue-200 text-xs mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-300 text-xs">© 2026 Office of the Chief Minister of Delhi</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
          </div>

          {error && (
            <div id="login-error" className="alert-warning mb-4 text-sm text-amber-800">
              ⚠️ {error}
            </div>
          )}

          <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            <button
              id="login-submit"
              type="submit"
              className="btn-primary w-full py-3"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="spinner w-4 h-4" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-blue-700 font-medium hover:underline">
              Register as a Citizen
            </Link>
          </p>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-400 text-center">
              For Admin/Officer access, contact your department administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
