'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Complaint {
  _id: string;
  ticketId: string;
  title: string;
  category: string;
  status: string;
  isCritical: boolean;
  createdAt: string;
  slaDeadline: string;
  slaBreached: boolean;
  isDisputed: boolean;
  location: { address: string };
}

const STATUS_BADGE: Record<string, string> = {
  submitted: 'badge-yellow',
  acknowledged: 'badge-blue',
  assigned: 'badge-blue',
  in_progress: 'badge-purple',
  resolved: 'badge-green',
  disputed: 'badge-orange',
  closed: 'badge-gray',
  escalated_to_cm: 'badge-red',
};

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Submitted',
  acknowledged: 'Acknowledged',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  disputed: 'Disputed',
  closed: 'Closed',
  escalated_to_cm: 'Escalated to CM',
};

export default function CitizenDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/complaints')
      .then(r => r.json())
      .then(data => {
        setComplaints(data.complaints ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? complaints
    : complaints.filter(c => c.status === filter);

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => !['resolved', 'closed'].includes(c.status)).length,
    resolved: complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length,
    disputed: complaints.filter(c => c.isDisputed).length,
  };

  return (
    <div className="animate-slide-up">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Filed', value: stats.total, icon: '📋', color: 'text-slate-900' },
          { label: 'Pending', value: stats.pending, icon: '⏳', color: 'text-amber-600' },
          { label: 'Resolved', value: stats.resolved, icon: '✅', color: 'text-green-600' },
          { label: 'Disputed', value: stats.disputed, icon: '⚖️', color: 'text-orange-600' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="text-2xl">{s.icon}</span>
            <p className={`stat-value ${s.color}`}>{s.value}</p>
            <p className="stat-label">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Header + CTA */}
      <div className="section-header">
        <h2 className="text-xl font-bold text-slate-900">My Complaints</h2>
        <Link href="/citizen/submit" id="btn-new-complaint" className="btn-primary text-sm px-4 py-2">
          + New Complaint
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['all', 'submitted', 'in_progress', 'resolved', 'disputed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-blue-700 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f === 'all' ? 'All' : STATUS_LABEL[f] ?? f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5">
              <div className="skeleton h-4 w-1/4 mb-2" />
              <div className="skeleton h-5 w-3/4 mb-3" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-500 font-medium">No complaints found</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">File your first complaint to get started</p>
          <Link href="/citizen/submit" className="btn-primary text-sm">
            File a Complaint
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <Link
              key={c._id}
              href={`/citizen/track/${c._id}`}
              className="card-hover p-5 block"
            >
              {c.isCritical && (
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="pulse-dot bg-red-500 critical-pulse" />
                  <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Critical — Escalated</span>
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 font-mono mb-0.5">{c.ticketId}</p>
                  <p className="font-semibold text-slate-900 truncate">{c.title}</p>
                  <p className="text-sm text-slate-500 mt-1 truncate">{c.location.address}</p>
                </div>
                <span className={STATUS_BADGE[c.status] ?? 'badge-gray'}>
                  {STATUS_LABEL[c.status] ?? c.status}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                <span>Filed {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                {c.slaBreached && (
                  <span className="text-red-500 font-medium">⚠️ SLA Breached</span>
                )}
                {c.isDisputed && (
                  <span className="text-orange-500 font-medium">⚖️ Dispute Filed</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
