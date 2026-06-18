import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { complaintService } from '../services/complaintService';
import { onComplaintUpdated } from '../services/socketService';
import { CheckCircle2, Calendar, Clock, User, ThumbsUp, Timer, ShieldCheck } from 'lucide-react';

const RESOLVED_STATUSES = ['resolved', 'Resolved'];
const isResolved = (c) => RESOLVED_STATUSES.includes(c.status);

// Full, human-friendly date + time, e.g. "13 Jun 2026, 12:05 PM"
const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// The moment a complaint was resolved: the stamped resolvedAt, else the last
// "resolved" entry in its update timeline (covers complaints resolved before
// the resolvedAt field existed).
const getResolvedAt = (c) => {
  if (c.resolvedAt) return c.resolvedAt;
  const updates = Array.isArray(c.updates) ? c.updates : [];
  const resolvedUpdate = [...updates].reverse().find(u => RESOLVED_STATUSES.includes(u.status));
  return resolvedUpdate?.timestamp || null;
};

const getRaisedAt = (c) => c.createdAt || c.date || null;

// "2d 3h", "5h 12m", "8m", "<1m"
const timeToResolve = (raised, resolved) => {
  if (!raised || !resolved) return '—';
  const ms = new Date(resolved).getTime() - new Date(raised).getTime();
  if (isNaN(ms) || ms < 0) return '—';
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return '<1m';
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const rem = mins % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${rem}m`;
  return `${rem}m`;
};

function SolvedCard({ complaint }) {
  const raisedAt = getRaisedAt(complaint);
  const resolvedAt = getResolvedAt(complaint);
  const resolver = complaint.resolverName || complaint.resolverEmail || 'Authority';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
    >
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-mono text-slate-400 font-medium">#{complaint.id}</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500 text-white">
                <CheckCircle2 className="h-3 w-3" /> Resolved
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200" title="Community votes">
                <ThumbsUp className="h-3 w-3" />
                {complaint.votes || 0}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">{complaint.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{complaint.category}</p>
          </div>
          {complaint.proofImage && (
            <img
              src={complaint.proofImage}
              alt="Proof of resolution"
              className="h-16 w-16 flex-shrink-0 rounded-xl object-cover border border-emerald-200"
            />
          )}
        </div>

        {/* Resolution details */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <User className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Resolved By</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{resolver}</p>
              {complaint.resolverName && complaint.resolverEmail && (
                <p className="text-xs text-slate-500 truncate">{complaint.resolverEmail}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Timer className="h-4 w-4 text-violet-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Time to Resolve</p>
              <p className="text-sm font-semibold text-slate-800">{timeToResolve(raisedAt, resolvedAt)}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Calendar className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Complaint Raised</p>
              <p className="text-sm font-semibold text-slate-800">{formatDateTime(raisedAt)}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <Clock className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wide">Resolved On</p>
              <p className="text-sm font-semibold text-emerald-800">{formatDateTime(resolvedAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function SolvedProblems() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await complaintService.getComplaints();
        setComplaints((res.data || []).filter(isResolved));
      } catch (e) {
        console.error('Failed to load solved problems:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Live: when a complaint is resolved elsewhere, move it into this list in real time
  useEffect(() => {
    const unsub = onComplaintUpdated((data) => {
      const updated = data.complaint;
      setComplaints(prev => {
        const without = prev.filter(c => c.id !== updated.id && c._id !== updated._id);
        return isResolved(updated) ? [updated, ...without] : without;
      });
    });
    return unsub;
  }, []);

  // Most recently resolved first
  const ordered = [...complaints].sort((a, b) => {
    const at = new Date(getResolvedAt(a) || 0).getTime();
    const bt = new Date(getResolvedAt(b) || 0).getTime();
    return bt - at;
  });

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
            </div>
            Solved Problems
          </h1>
          <p className="mt-1 text-slate-500">Every resolved complaint, with its resolver and the full raised-to-resolved timeline.</p>
        </div>
        <div className="bg-emerald-600 text-white rounded-2xl px-5 py-3 shadow-sm text-center">
          <span className="text-2xl font-black">{complaints.length}</span>
          <p className="text-xs font-medium opacity-80 mt-0.5">Total Resolved</p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/4 mb-3" />
              <div className="h-6 bg-slate-200 rounded w-3/4 mb-4" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-14 bg-slate-100 rounded-xl" />
                <div className="h-14 bg-slate-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : ordered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <p className="text-slate-500 font-medium text-base">No problems solved yet.</p>
          <p className="text-slate-400 text-sm mt-1">Resolved complaints will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ordered.map(complaint => (
            <SolvedCard key={complaint.id} complaint={complaint} />
          ))}
        </div>
      )}
    </div>
  );
}
