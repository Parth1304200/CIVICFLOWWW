'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Registration failed');
        setLoading(false);
        return;
      }

      // Auto sign-in after registration
      await signIn('credentials', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        redirect: false,
      });

      router.push('/citizen/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-700 text-white text-2xl flex items-center justify-center mx-auto mb-4">
            🏛️
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create Your Account</h1>
          <p className="text-slate-500 text-sm mt-1">Register to file and track civic complaints</p>
        </div>

        {error && (
          <div id="register-error" className="alert-warning mb-4 text-sm text-amber-800">
            ⚠️ {error}
          </div>
        )}

        <form id="register-form" onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label htmlFor="reg-name" className="label">Full Name</label>
            <input
              id="reg-name"
              type="text"
              className="input"
              placeholder="Rajesh Kumar"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              required
              minLength={2}
            />
          </div>
          <div>
            <label htmlFor="reg-email" className="label">Email Address</label>
            <input
              id="reg-email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="reg-phone" className="label">Mobile Number</label>
            <input
              id="reg-phone"
              type="tel"
              className="input"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={e => update('phone', e.target.value)}
              pattern="[+]?[0-9\s\-]{10,15}"
            />
          </div>
          <div>
            <label htmlFor="reg-password" className="label">Password</label>
            <input
              id="reg-password"
              type="password"
              className="input"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={e => update('password', e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div>
            <label htmlFor="reg-confirm" className="label">Confirm Password</label>
            <input
              id="reg-confirm"
              type="password"
              className="input"
              placeholder="Repeat password"
              value={form.confirmPassword}
              onChange={e => update('confirmPassword', e.target.value)}
              required
            />
          </div>
          <button
            id="register-submit"
            type="submit"
            className="btn-primary w-full py-3"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="spinner w-4 h-4" />
                Creating account...
              </span>
            ) : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-blue-700 font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
