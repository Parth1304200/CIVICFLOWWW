'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SecretariatLogin() {
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
      setError('Invalid credentials or insufficient access level.');
      return;
    }

    router.push('/secretariat/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white text-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            🏛️
          </div>
          <h1 className="text-xl font-bold text-white">Secretariat Portal</h1>
          <p className="text-slate-400 text-sm mt-1">Admin & Officer Access</p>
        </div>

        {error && (
          <div id="secretariat-login-error" className="mb-4 p-3 rounded-xl bg-red-900/50 border border-red-700 text-red-300 text-sm">
            ⚠️ {error}
          </div>
        )}

        <form id="secretariat-login-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="s-email" className="block text-sm font-medium text-slate-300 mb-1.5">
              Official Email
            </label>
            <input
              id="s-email"
              type="email"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="admin@delhicmo.gov.in"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label htmlFor="s-password" className="block text-sm font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <input
              id="s-password"
              type="password"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <button
            id="secretariat-login-submit"
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner w-4 h-4 border-white/50 border-t-white" />Signing In...</>
            ) : 'Sign In to Secretariat'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Access restricted to authorized government personnel only.
          <br />All sessions are logged and audited.
        </p>
      </div>
    </div>
  );
}
