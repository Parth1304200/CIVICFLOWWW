'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  total: number;
  pending: number;
  resolved: number;
  critical: number;
  slaBreached: number;
  disputed: number;
}

interface Complaint {
  _id: string;
  ticketId: string;
  title: string;
  status: string;
  isCritical: boolean;
  location: { address: string };
  createdAt: string;
  slaDeadline: string;
  slaBreached: boolean;
  assignedTo?: { name: string; department: string };
}

export default function SecretariatDashboard() {
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, resolved: 0, critical: 0, slaBreached: 0, disputed: 0 });
  const [recent, setRecent] = useState<Complaint[]>([]);
  const [critical, setCritical] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/complaints?limit=50').then(r => r.json()),
      fetch('/api/complaints?isCritical=true&limit=10').then(r => r.json()),
    ]).then(([all, crit]) => {
      const complaints: Complaint[] = all.complaints ?? [];
      setStats({
        total: all.total ?? 0,
        pending: complaints.filter((c: Complaint) => !['resolved', 'closed'].includes(c.status)).length,
        resolved: complaints.filter((c: Complaint) => ['resolved', 'closed'].includes(c.status)).length,
        critical: complaints.filter((c: Complaint) => c.isCritical).length,
        slaBreached: complaints.filter((c: Complaint) => c.slaBreached).length,
        disputed: 0,
      });
      setRecent(complaints.slice(0, 8));
      setCritical(crit.complaints ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const STATUS_COLOR: Record<string, string> = {
    submitted: 'badge-yellow',
    acknowledged: 'badge-blue',
    assigned: 'badge-blue',
    in_progress: 'badge-purple',
    resolved: 'badge-green',
    disputed: 'badge-orange',
    closed: 'badge-gray',
    escalated_to_cm: 'badge-red',
  };

  return (
    <div className="animate-slide-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'Total', value: stats.total, icon: '📋', color: 'text-slate-900' },
          { label: 'Pending', value: stats.pending, icon: '⏳', color: 'text-amber-600' },
          { label: 'Resolved', value: stats.resolved, icon: '✅', color: 'text-green-600' },
          { label: 'Critical', value: stats.critical, icon: '🚨', color: 'text-red-600' },
          { label: 'SLA Breached', value: stats.slaBreached, icon: '⚠️', color: 'text-red-500' },
          { label: 'Disputed', value: stats.disputed, icon: '⚖️', color: 'text-orange-600' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="text-xl">{s.icon}</span>
            <p className={`stat-value ${s.color}`}>
              {loading ? <span className="skeleton h-8 w-12 block" /> : s.value}
            </p>
            <p className="stat-label">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Critical Complaints */}
        <div className="lg:col-span-1">
          <div className="section-header">
            <h2 className="font-bold text-slate-900">🚨 Critical</h2>
            <Link href="/secretariat/complaints?isCritical=true" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          {critical.length === 0 ? (
            <div className="card p-6 text-center text-sm text-slate-400">
              <p className="text-2xl mb-2">✅</p>
              No critical complaints
            </div>
          ) : (
            <div className="space-y-3">
              {critical.map(c => (
                <Link key={c._id} href={`/citizen/track/${c._id}`} className="block">
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 hover:border-red-400 transition-colors">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="pulse-dot bg-red-500 critical-pulse" />
                      <span className="text-xs font-mono text-red-600">{c.ticketId}</span>
                    </div>
                    <p className="text-sm font-semibold text-red-900 truncate">{c.title}</p>
                    <p className="text-xs text-red-600 mt-0.5 truncate">{c.location.address}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Complaints */}
        <div className="lg:col-span-2">
          <div className="section-header">
            <h2 className="font-bold text-slate-900">Recent Complaints</h2>
            <Link href="/secretariat/complaints" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="card overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-10" />)}
              </div>
            ) : recent.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">No complaints yet.</div>
            ) : (
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Issue</th>
                    <th>Status</th>
                    <th>Officer</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(c => (
                    <tr key={c._id}>
                      <td className="font-mono text-xs font-semibold">{c.ticketId}</td>
                      <td className="text-sm max-w-[160px] truncate">{c.title}</td>
                      <td>
                        <span className={STATUS_COLOR[c.status] ?? 'badge-gray'}>
                          {c.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="text-xs text-slate-500">
                        {c.assignedTo?.name ?? <span className="text-amber-600">Unassigned</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
