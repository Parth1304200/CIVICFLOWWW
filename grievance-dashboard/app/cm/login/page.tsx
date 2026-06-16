'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function CMLogin() {
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
      setError('Access denied. CM credentials only.');
      return;
    }

    router.push('/cm/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-4xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-900/50">
            🏛️
          </div>
          <h1 className="text-2xl font-bold text-white">CM Dashboard</h1>
          <p className="text-blue-300 text-sm mt-1">Chief Minister Access Only</p>
        </div>

        {error && (
          <div id="cm-login-error" className="mb-4 p-3 rounded-xl bg-red-900/40 border border-red-600 text-red-300 text-sm">
            🔒 {error}
          </div>
        )}

        <form id="cm-login-form" onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
          <div>
            <label htmlFor="cm-email" className="block text-sm font-medium text-blue-200 mb-1.5">
              Official Email
            </label>
            <input
              id="cm-email"
              type="email"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              placeholder="rekha@gupta.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label htmlFor="cm-password" className="block text-sm font-medium text-blue-200 mb-1.5">
              Password
            </label>
            <input
              id="cm-password"
              type="password"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <button
            id="cm-login-submit"
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-900/40 disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner w-4 h-4 border-white/30 border-t-white" />Authenticating...</>
            ) : '🔐 Access CM Dashboard'}
          </button>
        </form>

        <p className="text-center text-xs text-blue-400/60 mt-6">
          Restricted access. All login attempts are recorded and audited.
        </p>
      </div>
    </div>
  );
}
