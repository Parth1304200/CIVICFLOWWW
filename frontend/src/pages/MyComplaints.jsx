import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { complaintService } from '../services/complaintService';
import { StatusTimeline } from '../components/local/StatusTimeline';
import { onComplaintUpdated } from '../services/socketService';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ChevronDown, ChevronUp, MapPin, Calendar, Tag, FileText, ThumbsUp } from 'lucide-react';

const statusColors = {
  initiated:             'bg-blue-50 text-blue-700 border-blue-200',
  under_review:          'bg-violet-50 text-violet-700 border-violet-200',
  construction_ongoing:  'bg-amber-50 text-amber-700 border-amber-200',
  fixing_issues:         'bg-orange-50 text-orange-700 border-orange-200',
  resolved:              'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending:               'bg-slate-50 text-slate-700 border-slate-200',
  'In Progress':         'bg-blue-50 text-blue-700 border-blue-200',
  Escalated:             'bg-red-50 text-red-700 border-red-200',
  Resolved:              'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const statusLabel = {
  initiated:            'Initiated',
  under_review:         'Under Review',
  construction_ongoing: 'Work in Progress',
  fixing_issues:        'Fixing Issues',
  resolved:             'Resolved',
  Pending:              'Pending',
  'In Progress':        'In Progress',
  Escalated:            'Escalated',
  Resolved:             'Resolved',
};

function ComplaintTracker({ complaint }) {
  const [expanded, setExpanded] = useState(false);
  const colorClass = statusColors[complaint.status] || 'bg-slate-50 text-slate-700 border-slate-200';
  const label = statusLabel[complaint.status] || complaint.status;
  const isResolved = complaint.status === 'resolved' || complaint.status === 'Resolved';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
    >
      {/* Card Header */}
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400 font-medium">#{complaint.id}</span>
              <span className={`text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${colorClass}`}>
                {label}
              </span>
              {isResolved && (
                <span className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500 text-white">
                  ✓ Resolved
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 truncate">{complaint.title}</h3>
          </div>
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex-shrink-0 p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
            title={expanded ? 'Hide details' : 'Show tracking'}
          >
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-3 mt-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <Tag className="h-3.5 w-3.5 text-slate-400" />
            {complaint.category}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            {complaint.date}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600" title="Community votes supporting your complaint">
            <ThumbsUp className="h-3.5 w-3.5" />
            {complaint.votes || 0} votes
          </span>
          {complaint.location && typeof complaint.location === 'object' && (
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {complaint.location.lat?.toFixed(4)}, {complaint.location.lng?.toFixed(4)}
            </span>
          )}
          {complaint.location && typeof complaint.location === 'string' && (
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {complaint.location}
            </span>
          )}
        </div>

        {/* Progress mini-bar */}
        {(() => {
          const steps = ['initiated','under_review','construction_ongoing','fixing_issues','resolved'];
          const idx = steps.findIndex(s => s === complaint.status);
          const pct = idx >= 0 ? ((idx + 1) / steps.length) * 100 : 10;
          return (
            <div className="mt-4">
              <div className="flex justify-between text-[11px] text-slate-400 font-medium mb-1.5">
                <span>Registered</span>
                <span>Resolved</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${isResolved ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-violet-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                />
              </div>
            </div>
          );
        })()}
      </div>

      {/* Expandable Detail Panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-5 sm:px-6 pb-6 pt-2">
              {/* Description */}
              {complaint.description && (
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{complaint.description}</p>
                </div>
              )}

              {/* Images */}
              {(complaint.image || complaint.proofImage) && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {complaint.image && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Your Evidence</p>
                      <img
                        src={complaint.image}
                        alt="Citizen Evidence"
                        className="h-32 w-full object-cover rounded-xl border border-slate-200"
                      />
                    </div>
                  )}
                  {complaint.proofImage && (
                    <div>
                      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1.5">✓ Admin Proof</p>
                      <img
                        src={complaint.proofImage}
                        alt="Resolution Proof"
                        className="h-32 w-full object-cover rounded-xl border border-emerald-200"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Full Delivery-Style Timeline */}
              <StatusTimeline updates={complaint.updates || []} currentStatus={complaint.status} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await complaintService.getMyComplaints();
        setComplaints(response.data);
      } catch (error) {
        console.error('Failed to load your complaints', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Live tracking — apply admin status/timeline updates in real time
  useEffect(() => {
    const unsub = onComplaintUpdated((data) => {
      setComplaints(prev =>
        prev.map(c =>
          (c.id === data.complaint.id || c._id === data.complaint._id) ? { ...c, ...data.complaint } : c
        )
      );
    });
    return unsub;
  }, []);

  const activeCount = complaints.filter(c =>
    !['resolved', 'Resolved'].includes(c.status)
  ).length;
  const resolvedCount = complaints.filter(c =>
    ['resolved', 'Resolved'].includes(c.status)
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Complaints</h1>
          <p className="mt-1 text-sm text-slate-500">Track the live status of all your submitted complaints.</p>
        </div>
        <button
          onClick={() => navigate('/submit')}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all"
        >
          <PlusCircle className="h-4 w-4" />
          New Complaint
        </button>
      </div>

      {/* Stats Strip */}
      {!loading && complaints.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: complaints.length, color: 'bg-slate-900 text-white' },
            { label: 'Active', value: activeCount, color: 'bg-blue-600 text-white' },
            { label: 'Resolved', value: resolvedCount, color: 'bg-emerald-600 text-white' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.color} rounded-2xl px-4 py-3 flex flex-col`}>
              <span className="text-2xl font-black">{stat.value}</span>
              <span className="text-xs font-medium opacity-80 mt-0.5">{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Complaints List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/4 mb-3" />
              <div className="h-6 bg-slate-200 rounded w-3/4 mb-4" />
              <div className="h-2 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
            <FileText className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">No complaints yet</h3>
          <p className="text-sm text-slate-400 mb-6">Submit your first complaint and track its progress here.</p>
          <button
            onClick={() => navigate('/submit')}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            Submit a Complaint
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map(complaint => (
            <ComplaintTracker key={complaint.id} complaint={complaint} />
          ))}
        </div>
      )}
    </div>
  );
}
