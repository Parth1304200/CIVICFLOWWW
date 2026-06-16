'use client';

import { useEffect, useState } from 'react';

interface AnalyticsData {
  byCategory: { _id: string; count: number; resolved: number }[];
  byStatus: { _id: string; count: number }[];
  byDept: { _id: string; count: number; avgRating: number }[];
  slaStats: { breached: number; onTime: number };
}

const CATEGORY_ICONS: Record<string, string> = {
  pothole: '🕳️',
  waterlogging: '💧',
  garbage: '🗑️',
  streetlight: '💡',
  sewer: '🔧',
  encroachment: '🚧',
  noise: '🔊',
  other: '📌',
  critical_gas_leak: '⚠️',
  critical_electrocution: '⚡',
  critical_structural: '🏚️',
  critical_fire: '🔥',
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/complaints?limit=200')
      .then(r => r.json())
      .then(({ complaints }) => {
        // Compute analytics client-side from the data
        const byCategory: Record<string, { count: number; resolved: number }> = {};
        const byStatus: Record<string, number> = {};
        const byDept: Record<string, { count: number; ratings: number[]; ratingSum: number }> = {};
        let breached = 0, onTime = 0;

        for (const c of complaints ?? []) {
          // Category
          if (!byCategory[c.category]) byCategory[c.category] = { count: 0, resolved: 0 };
          byCategory[c.category].count++;
          if (['resolved', 'closed'].includes(c.status)) byCategory[c.category].resolved++;

          // Status
          byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;

          // Dept
          const dept = c.assignedTo?.department ?? 'Unassigned';
          if (!byDept[dept]) byDept[dept] = { count: 0, ratings: [], ratingSum: 0 };
          byDept[dept].count++;
          if (c.citizenRating) { byDept[dept].ratingSum += c.citizenRating; byDept[dept].ratings.push(c.citizenRating); }

          // SLA
          if (c.slaBreached) breached++;
          else onTime++;
        }

        setData({
          byCategory: Object.entries(byCategory).map(([_id, v]) => ({ _id, ...v })).sort((a, b) => b.count - a.count),
          byStatus: Object.entries(byStatus).map(([_id, count]) => ({ _id, count })),
          byDept: Object.entries(byDept).map(([_id, v]) => ({
            _id,
            count: v.count,
            avgRating: v.ratings.length > 0 ? +(v.ratingSum / v.ratings.length).toFixed(1) : 0,
          })).sort((a, b) => b.count - a.count),
          slaStats: { breached, onTime },
        });
        setLoading(false);
      });
  }, []);

  const slaTotal = (data?.slaStats.breached ?? 0) + (data?.slaStats.onTime ?? 0);
  const slaCompliance = slaTotal > 0 ? Math.round((data!.slaStats.onTime / slaTotal) * 100) : 0;

  return (
    <div className="animate-slide-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">Grievance resolution performance metrics</p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-60 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* SLA Compliance */}
          <div className="card p-6">
            <h2 className="font-bold text-slate-900 mb-4">SLA Compliance</h2>
            <div className="flex items-center gap-6">
              <div className="relative" style={{ width: 100, height: 100 }}>
                <svg width="100" height="100" className="-rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke={slaCompliance >= 80 ? '#22c55e' : slaCompliance >= 60 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={2 * Math.PI * 42 * (1 - slaCompliance / 100)}
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-slate-900">{slaCompliance}%</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-slate-600">On Time: <strong>{data?.slaStats.onTime}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm text-slate-600">Breached: <strong>{data?.slaStats.breached}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="card p-6">
            <h2 className="font-bold text-slate-900 mb-4">Status Breakdown</h2>
            <div className="space-y-2">
              {data?.byStatus.map(s => {
                const total = data.byStatus.reduce((sum, x) => sum + x.count, 0);
                const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                return (
                  <div key={s._id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-600 capitalize">{s._id.replace(/_/g, ' ')}</span>
                      <span className="text-slate-900 font-semibold">{s.count} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* By Category */}
          <div className="card p-6">
            <h2 className="font-bold text-slate-900 mb-4">By Category</h2>
            <div className="space-y-3">
              {data?.byCategory.slice(0, 8).map(c => {
                const resRate = c.count > 0 ? Math.round((c.resolved / c.count) * 100) : 0;
                return (
                  <div key={c._id} className="flex items-center gap-3">
                    <span className="text-lg">{CATEGORY_ICONS[c._id] ?? '📌'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-700 capitalize truncate">{c._id.replace(/_/g, ' ')}</span>
                        <span className="text-slate-500 ml-2 shrink-0">{c.count} ({resRate}% resolved)</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${resRate}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* By Department */}
          <div className="card p-6">
            <h2 className="font-bold text-slate-900 mb-4">Department Performance</h2>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Cases</th>
                    <th>Avg Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.byDept.map(d => (
                    <tr key={d._id}>
                      <td className="text-sm font-medium text-slate-900">{d._id}</td>
                      <td className="text-sm text-slate-600">{d.count}</td>
                      <td>
                        {d.avgRating > 0 ? (
                          <span className={`text-sm font-semibold ${d.avgRating >= 4 ? 'text-green-600' : d.avgRating >= 3 ? 'text-amber-600' : 'text-red-600'}`}>
                            ⭐ {d.avgRating}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">No ratings</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
