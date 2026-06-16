'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import CriticalAlert from '@/components/ui/CriticalAlert';

const CMGeoMap = dynamic(() => import('@/components/maps/CMGeoMap'), { ssr: false });

interface NearbyComplaint {
  _id: string;
  ticketId: string;
  title: string;
  category: string;
  status: string;
  isCritical: boolean;
  location: { address: string; lat: number; lng: number };
  distanceKm: number;
  assignedTo?: { name: string; department: string; phone: string; accountabilityScore: number; tier: string };
  createdAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  submitted: 'bg-amber-100 text-amber-800',
  acknowledged: 'bg-blue-100 text-blue-800',
  assigned: 'bg-indigo-100 text-indigo-800',
  in_progress: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  disputed: 'bg-orange-100 text-orange-800',
  escalated_to_cm: 'bg-red-100 text-red-800',
  closed: 'bg-slate-100 text-slate-600',
};

export default function CMDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [complaints, setComplaints] = useState<NearbyComplaint[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved' | 'critical'>('all');
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.role !== 'cm') {
      router.replace('/cm/login');
    }
  }, [session, status, router]);

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation({ lat: 28.6139, lng: 77.209 });
      setLocationError('Geolocation not available. Using Delhi Secretariat.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationError('');
      },
      () => {
        setLocation({ lat: 28.6139, lng: 77.209 });
        setLocationError('GPS unavailable. Using Delhi Secretariat location.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  const fetchNearby = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/complaints/nearby?lat=${location.lat}&lng=${location.lng}&radius=2`);
      const data = await res.json();
      setComplaints(data.complaints ?? []);
      setLastRefresh(new Date());
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => { fetchLocation(); }, [fetchLocation]);

  useEffect(() => {
    if (!location) return;
    fetchNearby();
    const interval = setInterval(fetchNearby, 60000); // auto-refresh every 60s
    return () => clearInterval(interval);
  }, [location, fetchNearby]);

  const filtered = complaints.filter(c => {
    if (filter === 'pending') return !['resolved', 'closed'].includes(c.status);
    if (filter === 'resolved') return ['resolved', 'closed'].includes(c.status);
    if (filter === 'critical') return c.isCritical;
    return true;
  });

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => !['resolved', 'closed'].includes(c.status)).length,
    resolved: complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length,
    critical: complaints.filter(c => c.isCritical).length,
  };

  const activeCriticals = complaints.filter(c => c.isCritical && !dismissedAlerts.has(c._id));

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <span className="spinner w-10 h-10 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-700 text-white text-sm flex items-center justify-center">🏛️</div>
            <div>
              <p className="text-xs text-slate-400 leading-none">Delhi CMO</p>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">Grievance Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="cm-refresh"
              onClick={fetchNearby}
              disabled={loading}
              className="text-sm text-blue-600 font-medium disabled:opacity-40 flex items-center gap-1"
            >
              {loading ? <span className="spinner w-3.5 h-3.5" /> : '↻'}
              {loading ? 'Updating' : 'Refresh'}
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/cm/login' })}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Sign Out
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-1">
          {lastRefresh && (
            <p className="text-xs text-slate-400">
              Updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          {locationError && (
            <p className="text-xs text-amber-500">⚠️ {locationError}</p>
          )}
        </div>
      </header>

      {/* Critical Alerts */}
      {activeCriticals.length > 0 && (
        <div className="px-4 pt-4 space-y-3">
          {activeCriticals.map(c => (
            <CriticalAlert
              key={c._id}
              ticketId={c.ticketId}
              category={c.category}
              location={c.location.address}
              onDismiss={() => setDismissedAlerts(prev => new Set(Array.from(prev).concat(c._id)))}
            />
          ))}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2 px-4 pt-4">
        {[
          { label: 'Nearby', value: stats.total, color: 'text-slate-900', filter: 'all' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-600', filter: 'pending' },
          { label: 'Resolved', value: stats.resolved, color: 'text-green-600', filter: 'resolved' },
          { label: 'Critical', value: stats.critical, color: 'text-red-600', filter: 'critical' },
        ].map(s => (
          <button
            key={s.label}
            id={`cm-stat-${s.label.toLowerCase()}`}
            onClick={() => setFilter(s.filter as any)}
            className={`bg-white rounded-xl p-3 border text-center transition-all ${
              filter === s.filter ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-100'
            }`}
          >
            <p className={`text-xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* 2km Map */}
      {location && (
        <div className="mx-4 mt-4 rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: 240 }}>
          <CMGeoMap center={location} complaints={filtered} radiusKm={2} />
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 px-4 mt-4 overflow-x-auto pb-1 scrollbar-none">
        {(['all', 'pending', 'resolved', 'critical'] as const).map(f => (
          <button
            key={f}
            id={`cm-filter-${f}`}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && (
              <span className="ml-1 opacity-70">
                ({f === 'pending' ? stats.pending : f === 'resolved' ? stats.resolved : stats.critical})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Location Radius Label */}
      {location && (
        <p className="px-4 mt-2 text-xs text-slate-400">
          📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)} — Showing within 2km radius
        </p>
      )}

      {/* Complaint Cards */}
      <div className="px-4 mt-3 space-y-3">
        {filtered.length === 0 && !loading && (
          <div className="text-center py-12 card">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-slate-500 text-sm">
              No {filter !== 'all' ? filter : ''} complaints within 2km of your location.
            </p>
          </div>
        )}

        {filtered.map(c => (
          <div
            key={c._id}
            id={`cm-card-${c._id}`}
            className={`bg-white rounded-2xl border p-4 shadow-sm ${
              c.isCritical ? 'border-red-300 bg-red-50/30' : 'border-slate-100'
            }`}
          >
            {c.isCritical && (
              <div className="flex items-center gap-1.5 mb-2">
                <span className="pulse-dot bg-red-500 critical-pulse" />
                <span className="text-xs font-bold text-red-600 uppercase tracking-wide">
                  🚨 Critical — Escalated
                </span>
              </div>
            )}

            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-mono">{c.ticketId}</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5 leading-snug">{c.title}</p>
                <p className="text-xs text-slate-500 mt-1 truncate">{c.location.address}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${STATUS_BADGE[c.status] ?? 'bg-slate-100 text-slate-600'}`}>
                {c.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
              <span className="text-xs text-slate-400">📍 {c.distanceKm.toFixed(2)} km away</span>
              {c.assignedTo ? (
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-700">{c.assignedTo.name}</p>
                  <p className="text-xs text-slate-400">{c.assignedTo.department}</p>
                </div>
              ) : (
                <span className="text-xs text-amber-600 font-medium">⚠️ Unassigned</span>
              )}
            </div>

            {/* CM can call officer directly */}
            {c.assignedTo?.phone && (
              <a
                href={`tel:${c.assignedTo.phone}`}
                className="mt-2 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-50 text-green-700 text-xs font-semibold border border-green-200 hover:bg-green-100 transition-colors"
              >
                📞 Call {c.assignedTo.name}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
