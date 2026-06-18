import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Search, Filter, Shield, RefreshCw, CheckCircle2, Clock, Wrench, AlertCircle, Loader2, PackageCheck, ChevronDown, ChevronUp, MapPin, Calendar, Tag, Image as ImageIcon, FileText, Brain, Radio, ThumbsUp } from 'lucide-react';
import { complaintService } from '../../services/complaintService';
import { StatusTimeline } from './StatusTimeline';
import { motion, AnimatePresence } from 'framer-motion';
import { onNewComplaint, onHotspotAlert, onComplaintUpdated } from '../../services/socketService';
import { SecureChatWidget } from './SecureChatWidget';

const STATUS_OPTIONS = [
  { value: 'initiated', label: 'Initiated', icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { value: 'under_review', label: 'Under Review', icon: Clock, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
  { value: 'construction_ongoing', label: 'Work in Progress', icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { value: 'fixing_issues', label: 'Fixing Issues', icon: Loader2, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  { value: 'resolved', label: 'Resolved', icon: PackageCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
];

const statusColorBadge = {
  initiated: 'bg-blue-50 text-blue-700 border-blue-200',
  under_review: 'bg-violet-50 text-violet-700 border-violet-200',
  construction_ongoing: 'bg-amber-50 text-amber-700 border-amber-200',
  fixing_issues: 'bg-orange-50 text-orange-700 border-orange-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending: 'bg-slate-50 text-slate-700 border-slate-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  Escalated: 'bg-red-50 text-red-700 border-red-200',
  Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};
const statusLabel = {
  initiated: 'Initiated',
  under_review: 'Under Review',
  construction_ongoing: 'Work in Progress',
  fixing_issues: 'Fixing Issues',
  resolved: 'Resolved',
};

// Admin complaint card with real-time update panel
function AdminComplaintCard({ complaint, onUpdate }) {
  const steps = ['initiated', 'under_review', 'construction_ongoing', 'fixing_issues', 'resolved'];
  const currentStepIdx = steps.indexOf(complaint.status);
  const nextStatus = currentStepIdx >= 0 && currentStepIdx < steps.length - 1
    ? steps[currentStepIdx + 1]
    : complaint.status;

  const [expanded, setExpanded] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(nextStatus);
  const [message, setMessage] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState('');
  const [updating, setUpdating] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);

  const isResolved = complaint.status === 'resolved' || complaint.status === 'Resolved';
  const badgeClass = statusColorBadge[complaint.status] || 'bg-slate-50 text-slate-700 border-slate-200';
  const progressPct = (() => {
    const idx = steps.indexOf(complaint.status);
    return idx >= 0 ? ((idx + 1) / steps.length) * 100 : 10;
  })();

  const handleProofChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setProofPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (statusToApply = selectedStatus) => {
    // Guard: never allow moving back to an earlier stage.
    const targetIdx = steps.indexOf(statusToApply);
    if (targetIdx !== -1 && currentStepIdx !== -1 && targetIdx < currentStepIdx) {
      return;
    }
    if (statusToApply === 'resolved' && !proofPreview && !complaint.proofImage) {
      alert('A proof image is required to mark this complaint as resolved.');
      return;
    }
    setUpdating(true);
    try {
      await onUpdate(complaint.id, statusToApply, message || `Status updated to: ${statusLabel[statusToApply] || statusToApply}`, proofPreview);
      setMessage('');
      setProofFile(null);
      setProofPreview('');
      // Advance the selection to the next forward step (never back to a past one)
      setSelectedStatus(targetIdx >= 0 && targetIdx < steps.length - 1 ? steps[targetIdx + 1] : statusToApply);
      setJustUpdated(true);
      setTimeout(() => setJustUpdated(false), 3000);
    } catch (e) {
      console.error('Admin update failed:', e);
    } finally {
      setUpdating(false);
    }
  };

  const emergencyCategories = ['Gas Leakage', 'Building Collapse', 'Electrocution', 'Critical Fire'];
  const isEmergency = emergencyCategories.includes(complaint.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 relative ${justUpdated ? 'border-emerald-300 shadow-emerald-100' : isEmergency ? 'border-2 border-red-400 bg-red-50/30' : 'border-slate-200 hover:shadow-md'
        }`}
    >
      {isEmergency && (
        <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider animate-pulse">
          Critical Emergency
        </div>
      )}
      {/* Header */}
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-mono text-slate-400 font-medium">#{complaint.id}</span>
              <span className={`text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
                {statusLabel[complaint.status] || complaint.status}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200" title="Community votes">
                <ThumbsUp className="h-3 w-3" />
                {complaint.votes || 0}
              </span>
              {justUpdated && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500 text-white"
                >
                  ✓ Updated
                </motion.span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900">{complaint.title}</h3>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <p className="text-xs text-slate-500">{complaint.category}</p>
              {complaint.mlCategory && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Brain className="h-2.5 w-2.5" />
                  {complaint.mlCategory}
                  {complaint.mlConfidence && (
                    <span className="text-indigo-400 ml-0.5">{(complaint.mlConfidence * 100).toFixed(0)}%</span>
                  )}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex-shrink-0 p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>

        {/* Progress mini-bar */}
        <div className="mt-4">
          <div className="flex justify-between text-[11px] text-slate-400 font-medium mb-1.5">
            <span>Registered</span>
            <span>{Math.round(progressPct)}% complete</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${isResolved ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-violet-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Quick update buttons — only statuses AHEAD of the current one are clickable */}
        {currentStepIdx < steps.length - 1 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Quick Update →</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const targetIdx = steps.indexOf(opt.value);
                const isDisabled = targetIdx <= currentStepIdx;
                return (
                  <button
                    key={opt.value}
                    disabled={isDisabled || updating}
                    onClick={() => {
                      if (isDisabled || updating) return;
                      setSelectedStatus(opt.value);
                      // 'resolved' needs a proof image, so open the panel to upload it;
                      // any other forward status is applied immediately on click.
                      if (opt.value === 'resolved') {
                        if (!expanded) setExpanded(true);
                      } else {
                        handleUpdate(opt.value);
                      }
                    }}
                    className={`flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-semibold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border transition-all ${
                      isDisabled
                        ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                        : selectedStatus === opt.value
                          ? `${opt.bg} ${opt.color} ${opt.border} ring-2 ring-offset-1 ring-current`
                          : `bg-white text-slate-600 border-slate-200 hover:${opt.bg} hover:${opt.color}`
                      }`}
                  >
                    <Icon className="h-3 w-3" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Expandable Panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-5 sm:px-6 pb-6 pt-4">
              {/* Description */}
              {complaint.description && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{complaint.description}</p>
                </div>
              )}

              {/* Meta */}
              <div className="flex flex-wrap gap-3 mb-4">
                {complaint.date && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />Submitted: {complaint.date}
                  </span>
                )}
                {complaint.location && typeof complaint.location === 'object' && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {complaint.location.lat?.toFixed(4)}, {complaint.location.lng?.toFixed(4)}
                  </span>
                )}
              </div>

              {/* Images */}
              {(complaint.image || complaint.proofImage) && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {complaint.image && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Citizen Evidence</p>
                      <img src={complaint.image} alt="Evidence" className="h-28 w-full object-cover rounded-xl border border-slate-200" />
                    </div>
                  )}
                  {complaint.proofImage && (
                    <div>
                      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1.5">✓ Proof of Resolution</p>
                      <img src={complaint.proofImage} alt="Proof" className="h-28 w-full object-cover rounded-xl border border-emerald-200" />
                    </div>
                  )}
                </div>
              )}

              {/* Status Timeline */}
              <StatusTimeline updates={complaint.updates || []} currentStatus={complaint.status} />

              {/* Admin Update Panel — available in every state so status can be reverted */}
              {(
                <div className="mt-6 p-4 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 shadow-inner">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-amber-600" />
                    Update Status
                  </h4>

                  {/* Status selector buttons — only forward statuses are selectable */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                    {STATUS_OPTIONS.map(opt => {
                      const Icon = opt.icon;
                      const isSelected = selectedStatus === opt.value;
                      const targetIdx = steps.indexOf(opt.value);
                      const isDisabled = targetIdx <= currentStepIdx;
                      return (
                        <button
                          key={opt.value}
                          disabled={isDisabled}
                          onClick={() => { if (!isDisabled) setSelectedStatus(opt.value); }}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                            isDisabled
                              ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-50'
                              : isSelected
                                ? `${opt.bg} ${opt.color} ${opt.border} ring-2 ring-current shadow-sm`
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                          <Icon className={`h-5 w-5 ${isDisabled ? 'text-slate-300' : isSelected ? opt.color : 'text-slate-400'} ${opt.value === 'fixing_issues' && isSelected && !isDisabled ? 'animate-spin' : ''}`} />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Message */}
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Add a message to the citizen (optional)..."
                    rows={2}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white placeholder:text-slate-400"
                  />

                  {/* Proof image upload (required for resolved) */}
                  {selectedStatus === 'resolved' && (
                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-red-600 mb-1.5">
                        Proof Image <span className="text-red-500">*</span> (Required to mark as Resolved)
                      </label>
                      {proofPreview ? (
                        <div className="relative inline-block">
                          <img src={proofPreview} alt="Proof preview" className="h-24 w-auto rounded-xl border border-emerald-200 object-cover" />
                          <button
                            onClick={() => { setProofFile(null); setProofPreview(''); }}
                            className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 text-xs"
                          >✕</button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-red-200 rounded-xl px-4 py-3 hover:bg-red-50 transition-colors">
                          <ImageIcon className="h-4 w-4 text-red-400" />
                          <span className="text-sm text-red-500 font-medium">Upload proof image</span>
                          <input type="file" accept="image/*" onChange={handleProofChange} className="sr-only" />
                        </label>
                      )}
                    </div>
                  )}

                  {/* Apply button */}
                  <button
                    onClick={() => handleUpdate()}
                    disabled={updating}
                    className="mt-4 w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:opacity-60 text-white text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Apply Update
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, fetchMe } = useAuth();

  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [search, setSearch] = useState('');

  const role = localStorage.getItem('role');
  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await complaintService.getComplaints();
      setComplaints(res.data);
      if (typeof fetchMe === 'function') {
        await fetchMe();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchMe]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Socket.io real-time listeners ────────────────────────
  const [hotspotBanner, setHotspotBanner] = useState(null);

  useEffect(() => {
    const unsubNew = onNewComplaint((data) => {
      setComplaints(prev => [data.complaint, ...prev]);
    });

    const unsubHotspot = onHotspotAlert((data) => {
      setHotspotBanner(data);
      setTimeout(() => setHotspotBanner(null), 10000);
    });

    const unsubUpdate = onComplaintUpdated((data) => {
      setComplaints(prev =>
        prev.map(c => c.id === data.complaint.id ? data.complaint : c)
      );
      if (typeof fetchMe === 'function') {
        fetchMe();
      }
    });

    return () => {
      unsubNew();
      unsubHotspot();
      unsubUpdate();
    };
  }, [fetchMe]);

  const handleUpdate = async (id, status, message, proofImage) => {
    await complaintService.updateComplaintStatus(id, { status, message, proofImage });
    const newUpdate = { status, message, timestamp: new Date().toISOString() };
    setComplaints(prev => prev.map(c =>
      c.id === id
        ? { ...c, status, proofImage: proofImage || c.proofImage, updates: [...(c.updates || []), newUpdate] }
        : c
    ));
    if (typeof fetchMe === 'function') {
      await fetchMe();
    }
  };

  // Resolved complaints move to the "Solved Problems" view and are hidden here
  let displayComplaints = complaints.filter(c => !['resolved', 'Resolved'].includes(c.status));
  if (filterStatus !== 'all') {
    displayComplaints = displayComplaints.filter(c => c.status === filterStatus);
  }
  if (search.trim()) {
    const q = search.toLowerCase();
    displayComplaints = displayComplaints.filter(c =>
      c.title?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q) ||
      c.id?.toLowerCase().includes(q)
    );
  }
  // Rank by votes first (most-voted to top), then by chosen date order
  displayComplaints.sort((a, b) => {
    const aVotes = a.votes || 0;
    const bVotes = b.votes || 0;
    if (aVotes !== bVotes) return bVotes - aVotes;
    const aDate = new Date(a.date || 0);
    const bDate = new Date(b.date || 0);
    return sortOrder === 'newest' ? bDate - aDate : aDate - bDate;
  });

  const emergencyCategories = ['Gas Leakage', 'Building Collapse', 'Electrocution', 'Critical Fire'];
  const emergencyComplaints = displayComplaints.filter(c => emergencyCategories.includes(c.category));
  const standardComplaints = displayComplaints.filter(c => !emergencyCategories.includes(c.category));

  const stats = {
    total: complaints.length,
    active: complaints.filter(c => !['resolved', 'Resolved'].includes(c.status)).length,
    resolved: complaints.filter(c => ['resolved', 'Resolved'].includes(c.status)).length,
    emergencies: complaints.filter(c => emergencyCategories.includes(c.category) && !['resolved', 'Resolved'].includes(c.status)).length
  };

  const myFlaggedComplaints = complaints.filter(c =>
    c.resolvedBy && String(c.resolvedBy) === String(user?._id) &&
    c.falseClosureReport?.isReported === true &&
    c.falseClosureReport?.status === 'Pending'
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      {/* Hotspot Alert Banner */}
      <AnimatePresence>
        {hotspotBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl text-white flex items-center gap-3 shadow-lg"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Radio className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">🔥 HOTSPOT ALERT — {hotspotBanner.category}</p>
              <p className="text-white/80 text-xs mt-0.5">{hotspotBanner.count} complaints in the last 10 minutes. Immediate attention required.</p>
            </div>
            <button onClick={() => setHotspotBanner(null)} className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <Shield className="h-6 w-6 text-amber-600" />
            </div>
            Admin Operations Hub
          </h1>
          <p className="mt-1 text-slate-500 text-xs sm:text-sm">Manage all citizen complaints and update their tracking status in real time.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all animate-none"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900">{user?.name || user?.email}</p>
            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs uppercase tracking-wide font-semibold">Administrator</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'bg-slate-900 text-white' },
            { label: 'Active', value: stats.active, color: 'bg-blue-600 text-white' },
            { label: 'Resolved', value: stats.resolved, color: 'bg-emerald-600 text-white' },
            { label: 'Emergencies', value: stats.emergencies, color: 'bg-red-600 text-white animate-pulse' },
            { label: 'Performance Points', value: user?.points !== undefined ? user.points : 0, color: 'bg-violet-600 text-white' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-xl p-3 sm:rounded-2xl sm:px-4 sm:py-3 shadow-sm`}>
              <span className="text-xl sm:text-2xl font-black">{s.value}</span>
              <p className="text-[10px] sm:text-xs font-medium opacity-80 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* False Closure Reports Alert */}
      {myFlaggedComplaints.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 shadow-sm animate-in fade-in duration-300">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-amber-800 text-sm">Action Required: Flagged Resolutions</h4>
            <p className="text-amber-700 text-xs mt-0.5">
              Citizens have reported {myFlaggedComplaints.length} of your resolved complaints as incomplete or fake closures. These reports are currently under Chief Minister (CM) review:
            </p>
            <ul className="mt-2 space-y-1.5 border-t border-amber-200/50 pt-2">
              {myFlaggedComplaints.map(c => (
                <li key={c.id} className="text-xs text-amber-900 font-medium list-disc list-inside">
                  <span className="font-mono bg-amber-100 px-1 py-0.5 rounded font-bold">#{c.id}</span> - "{c.title}"
                  <span className="text-amber-700 italic ml-1">(Reason: {c.falseClosureReport?.reason})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center mb-6">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1">
          <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by title, category, or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm border-0 outline-none bg-transparent placeholder:text-slate-400 text-slate-900"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All ({stats.active})</option>
              <option value="initiated">Initiated</option>
              <option value="under_review">Under Review</option>
              <option value="construction_ongoing">Work in Progress</option>
              <option value="fixing_issues">Fixing Issues</option>
            </select>
          </div>
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Complaint Cards */}
      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/4 mb-3" />
              <div className="h-6 bg-slate-200 rounded w-3/4 mb-4" />
              <div className="h-2 bg-slate-100 rounded-full" />
            </div>
          ))
        ) : displayComplaints.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-500 font-medium text-base">No complaints match this filter.</p>
            <p className="text-slate-400 text-sm mt-1">Try a different status or search term.</p>
          </div>
        ) : (
          <>
            {emergencyComplaints.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-bold text-red-700 flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5" /> Active Emergencies
                </h2>
                <div className="space-y-4">
                  {emergencyComplaints.map(complaint => (
                    <AdminComplaintCard key={complaint.id} complaint={complaint} onUpdate={handleUpdate} />
                  ))}
                </div>
              </div>
            )}

            {standardComplaints.length > 0 && (
              <div>
                {emergencyComplaints.length > 0 && (
                  <h2 className="text-lg font-bold text-slate-800 mb-3">Standard Complaints</h2>
                )}
                <div className="space-y-4">
                  {standardComplaints.map(complaint => (
                    <AdminComplaintCard key={complaint.id} complaint={complaint} onUpdate={handleUpdate} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Real-time E2E Chat */}
      <SecureChatWidget role="admin" />
    </div>
  );
}
