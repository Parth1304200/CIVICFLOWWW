'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

const NAV = [
  { href: '/citizen/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/citizen/submit', label: 'File Complaint', icon: '📋' },
];

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/auth/login');
    if (status === 'authenticated' && (session?.user as any)?.role !== 'citizen') {
      router.replace('/auth/login');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="spinner w-8 h-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-700 text-white text-sm flex items-center justify-center">🏛️</div>
            <div>
              <p className="font-semibold text-slate-900 text-sm leading-none">Delhi CMO</p>
              <p className="text-xs text-slate-400">Grievance Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 hidden sm:block">
              {(session?.user as any)?.name}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
              className="btn-ghost text-xs px-3 py-2"
            >
              Sign Out
            </button>
          </div>
        </div>
        {/* Tab nav */}
        <div className="max-w-5xl mx-auto px-4 flex gap-1 pb-0">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                pathname === n.href
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {n.icon} {n.label}
            </Link>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
