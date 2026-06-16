'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

const NAV = [
  { href: '/secretariat/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/secretariat/complaints', label: 'Complaints', icon: '📋' },
  { href: '/secretariat/officers', label: 'Officers', icon: '👷' },
  { href: '/secretariat/analytics', label: 'Analytics', icon: '📈' },
];

export default function SecretariatLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/secretariat/login');
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (!['admin', 'cm', 'officer'].includes(role)) {
        router.replace('/secretariat/login');
      }
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="spinner w-8 h-8 text-blue-600" />
      </div>
    );
  }

  const role = (session?.user as any)?.role;

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col fixed h-full z-30">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center text-base">🏛️</div>
            <div>
              <p className="font-bold text-slate-900 text-sm leading-none">Delhi CMO</p>
              <p className="text-xs text-slate-400 mt-0.5">Secretariat Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              id={`nav-${n.href.split('/').pop()}`}
              className={pathname === n.href ? 'nav-link-active' : 'nav-link'}
            >
              <span className="text-base">{n.icon}</span>
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              {(session?.user?.name ?? 'A')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{session?.user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{role}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="btn-ghost w-full text-xs py-2 text-slate-500"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 p-6 min-h-screen">
        {children}
      </main>
    </div>
  );
}
