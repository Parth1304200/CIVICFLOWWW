import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { complaintService } from '../services/complaintService';
import { MapPin, AlertCircle, Loader2, ShieldAlert, CheckCircle2, XCircle, FileText, ThumbsUp, Globe, Crosshair, ClipboardList, Users, ChevronDown, ChevronUp, Award, Wrench, Phone, ShieldCheck, AlertTriangle } from 'lucide-react';
import { SecureChatWidget } from '../components/local/SecureChatWidget';
import { StatusTimeline } from '../components/local/StatusTimeline';
import { onComplaintUpdated } from '../services/socketService';
import { sortByPriority, isEmergency } from '../utils/complaintSort';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icons in React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const STATUS_LABELS = {
  initiated: 'Initiated',
  under_review: 'Under Review',
  construction_ongoing: 'Work in Progress',
  fixing_issues: 'Fixing Issues',
  resolved: 'Resolved',
  Resolved: 'Resolved',
  Pending: 'Pending',
  'In Progress': 'In Progress',
  Escalated: 'Escalated',
};
const RESOLVED = ['resolved', 'Resolved'];

const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Oversight card — lets the CM audit exactly what the admin has done on a
// complaint (the full status timeline) plus who resolved it and when.
function AdminProcessCard({ complaint }) {
  const [open, setOpen] = useState(false);
  const updates = Array.isArray(complaint.updates) ? complaint.updates : [];
  const lastUpdate = updates[updates.length - 1];
  const resolved = RESOLVED.includes(complaint.status);
  const flagged = complaint.falseClosureReport?.isReported === true;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${flagged ? 'border-red-300' : 'border-slate-200'}`}>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-mono text-slate-400 font-medium">#{complaint.id}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${resolved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {STATUS_LABELS[complaint.status] || complaint.status}
              </span>
              {isEmergency(complaint) && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">Emergency</span>
              )}
              {flagged && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-600 text-white">Flagged: {complaint.falseClosureReport?.status}</span>
              )}
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                <ThumbsUp className="h-2.5 w-2.5" /> {complaint.votes || 0}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 truncate">{complaint.title}</h3>
            <p className="text-xs text-slate-500">{complaint.category}</p>
          </div>
          <button onClick={() => setOpen(v => !v)} className="flex-shrink-0 p-2 rounded-full hover:bg-slate-100 text-slate-500" title={open ? 'Hide activity' : 'View admin activity'}>
            {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>

        {/* Latest admin action summary */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Raised</p>
            <p className="font-semibold text-slate-700">{formatDateTime(complaint.createdAt || complaint.date)}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Handled By</p>
            <p className="font-semibold text-slate-700 truncate">{complaint.resolverName || complaint.resolverEmail || (complaint.resolvedBy ? 'Assigned officer' : 'Unassigned')}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Last Action</p>
            <p className="font-semibold text-slate-700">{lastUpdate ? formatDateTime(lastUpdate.timestamp) : 'No actions yet'}</p>
          </div>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 px-4 sm:px-5 pb-5">
          {complaint.description && (
            <p className="text-xs text-slate-600 mt-3 mb-1">{complaint.description}</p>
          )}
          <StatusTimeline updates={updates} currentStatus={complaint.status} />
        </div>
      )}
    </div>
  );
}

// Officer performance card — points, live workload (bandwidth), resolutions,
// and integrity flag (resolutions overturned as false closures).
function OfficerCard({ officer }) {
  const integrityRisk = officer.falseClosures > 0 || officer.points < 0;
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 ${integrityRisk ? 'border-red-300' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 truncate">{officer.name}</h3>
          <p className="text-xs text-slate-500 truncate">{officer.email}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{officer.role}</span>
            {officer.phone && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500"><Phone className="h-2.5 w-2.5" />{officer.phone}</span>
            )}
          </div>
        </div>
        <div className={`flex flex-col items-center justify-center rounded-xl px-3 py-2 ${officer.points < 0 ? 'bg-red-50 text-red-700' : 'bg-violet-50 text-violet-700'}`} title="Performance points">
          <Award className="h-4 w-4" />
          <span className="text-lg font-black leading-none mt-0.5">{officer.points}</span>
          <span className="text-[9px] font-semibold uppercase">points</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
          <Wrench className="h-3.5 w-3.5 text-amber-600 mx-auto mb-0.5" />
          <p className="text-base font-black text-amber-700">{officer.active}</p>
          <p className="text-[9px] font-semibold text-amber-600 uppercase">Active</p>
        </div>
        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mx-auto mb-0.5" />
          <p className="text-base font-black text-emerald-700">{officer.resolved}</p>
          <p className="text-[9px] font-semibold text-emerald-600 uppercase">Resolved</p>
        </div>
        <div className={`p-2 rounded-lg border ${officer.falseClosures > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
          <AlertTriangle className={`h-3.5 w-3.5 mx-auto mb-0.5 ${officer.falseClosures > 0 ? 'text-red-600' : 'text-slate-400'}`} />
          <p className={`text-base font-black ${officer.falseClosures > 0 ? 'text-red-700' : 'text-slate-500'}`}>{officer.falseClosures}</p>
          <p className={`text-[9px] font-semibold uppercase ${officer.falseClosures > 0 ? 'text-red-600' : 'text-slate-400'}`}>False Closures</p>
        </div>
      </div>
    </div>
  );
}

export function CMDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [allComplaints, setAllComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingReports, setFetchingReports] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  
  const [activeTab, setActiveTab] = useState('nearby'); // 'nearby' | 'oversight' | 'officers' | 'reports'
  const [scope, setScope] = useState('nearby'); // 'nearby' (2km) or 'delhi' (all)
  const [processingId, setProcessingId] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [fetchingOfficers, setFetchingOfficers] = useState(false);

  const DELHI_CENTER = [28.6139, 77.2090];
  const RESOLVED_STATUSES = ['resolved', 'Resolved'];

  // Source list depends on the chosen scope
  const scopedComplaints = scope === 'nearby'
    ? complaints
    : allComplaints.filter(c => !RESOLVED_STATUSES.includes(c.status) && c.location?.lat && c.location?.lng);

  // Ranked: emergency first, then most-voted, then newest
  const rankedComplaints = sortByPriority(scopedComplaints);
  const emergencyComplaints = rankedComplaints.filter(c => isEmergency(c));
  const standardComplaints = rankedComplaints.filter(c => !isEmergency(c));

  const mapCenter = scope === 'nearby' && location ? [location.lat, location.lng] : DELHI_CENTER;
  const mapZoom = scope === 'nearby' ? 14 : 11;

  // Load nearby complaints based on GPS location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLocation({ lat, lng });

          try {
            const res = await complaintService.getNearbyComplaints(lat, lng, 2);
            setComplaints(res.data || []);
            setError('');
          } catch (err) {
            setError(err.message || 'Failed to fetch nearby complaints');
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          console.warn("Geolocation failed or denied", err);
          setError('Location access denied. Please enable location to see nearby complaints.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
    }
  }, []);

  // Fetch all complaints to count and display false closures
  const fetchAllComplaints = async () => {
    setFetchingReports(true);
    try {
      const res = await complaintService.getComplaints();
      setAllComplaints(res.data || []);
    } catch (err) {
      console.warn('Failed to fetch all complaints:', err);
    } finally {
      setFetchingReports(false);
    }
  };

  // Fetch officer/admin performance for CM oversight
  const fetchOfficers = async () => {
    setFetchingOfficers(true);
    try {
      const res = await complaintService.getOfficers();
      setOfficers(res.data || []);
    } catch (err) {
      console.warn('Failed to fetch officers:', err);
    } finally {
      setFetchingOfficers(false);
    }
  };

  useEffect(() => {
    fetchAllComplaints();
    fetchOfficers();
  }, []);

  // Live oversight: reflect admin actions in real time across all views
  useEffect(() => {
    const unsub = onComplaintUpdated((data) => {
      const updated = data.complaint;
      const upsert = (list) => {
        const exists = list.some(c => c.id === updated.id || c._id === updated._id);
        return exists
          ? list.map(c => (c.id === updated.id || c._id === updated._id) ? { ...c, ...updated } : c)
          : [updated, ...list];
      };
      setAllComplaints(prev => upsert(prev));
      setComplaints(prev => prev.map(c => (c.id === updated.id || c._id === updated._id) ? { ...c, ...updated } : c));
      // Points / workload may have changed — refresh the officer board
      fetchOfficers();
    });
    return unsub;
  }, []);

  const handleAction = async (id, action) => {
    setProcessingId(id);
    try {
      await complaintService.handleFalseClosure(id, action);
      // Refresh complaints + officer board (a penalty changes points)
      await fetchAllComplaints();
      fetchOfficers();
      // Also refresh nearby list if coordinates are set
      if (location) {
        const res = await complaintService.getNearbyComplaints(location.lat, location.lng, 2);
        setComplaints(res.data || []);
      }
    } catch (err) {
      alert(err.message || `Failed to ${action} the report.`);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingReports = allComplaints.filter(
    (c) => c.falseClosureReport?.isReported === true && c.falseClosureReport?.status === 'Pending'
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            Chief Minister Dashboard
          </h1>
          <p className="mt-1.5 text-slate-500 text-sm">
            Oversee regional compliance, evaluate unresolved municipal requests, and handle false closure reports.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 overflow-x-auto scrollbar-none whitespace-nowrap">
        <button
          onClick={() => setActiveTab('nearby')}
          className={`flex-shrink-0 pb-3 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'nearby'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Nearby Map & Feed
        </button>
        <button
          onClick={() => { setActiveTab('oversight'); fetchAllComplaints(); }}
          className={`flex-shrink-0 pb-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'oversight'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          All Complaints & Admin Activity
        </button>
        <button
          onClick={() => { setActiveTab('officers'); fetchOfficers(); }}
          className={`flex-shrink-0 pb-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'officers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="h-4 w-4" />
          Officer Performance
        </button>
        <button
          onClick={() => {
            setActiveTab('reports');
            fetchAllComplaints();
          }}
          className={`flex-shrink-0 pb-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          False Closure Reports
          {pendingReports.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
              {pendingReports.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'nearby' && (
        <div className="space-y-4">
          {/* Scope Filter: 2km radius vs all of Delhi */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => setScope('nearby')}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-all ${
                scope === 'nearby' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Crosshair className="h-3.5 w-3.5" />
              Within 2km
            </button>
            <button
              onClick={() => setScope('delhi')}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-all ${
                scope === 'delhi' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              All of Delhi
            </button>
          </div>

          {(scope === 'nearby' && loading) ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Detecting location and fetching data...</p>
          </div>
        ) : (scope === 'nearby' && error) ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-6 rounded-xl flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p className="font-semibold">{error}</p>
            <p className="text-xs mt-1 text-red-500">Switch to "All of Delhi" to view every complaint without location access.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map View */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h2 className="font-bold text-slate-800 text-sm">
                  {scope === 'nearby' ? '2km Radius Map' : 'Delhi-wide Map'}
                </h2>
                <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                  {rankedComplaints.length} active issues
                </span>
              </div>
              <div className="h-[500px] w-full relative z-0">
                <MapContainer
                  key={scope}
                  center={mapCenter}
                  zoom={mapZoom}
                  scrollWheelZoom={true}
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* CM Location Marker + 2km radius (only in nearby scope) */}
                  {scope === 'nearby' && location && (
                    <>
                      <Marker position={[location.lat, location.lng]}>
                        <Popup>
                          <div className="text-center">
                            <p className="font-bold text-blue-700">Your Location</p>
                            <p className="text-xs text-slate-500">Center of 2km radius</p>
                          </div>
                        </Popup>
                      </Marker>
                      <Circle
                        center={[location.lat, location.lng]}
                        radius={2000}
                        pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1, weight: 1 }}
                      />
                    </>
                  )}

                  {/* Complaint Markers */}
                  {rankedComplaints.map((c) => (
                    c.location?.lat && c.location?.lng ? (
                      <Marker key={c._id || c.id} position={[c.location.lat, c.location.lng]}>
                        <Popup>
                          <div className="max-w-[220px]">
                            {c.image && (
                              <img src={c.image} alt="Evidence" className="w-full h-24 object-cover rounded-md mb-2 border border-slate-200" />
                            )}
                            <p className="font-bold text-sm mb-0.5">{c.title}</p>
                            <p className="text-xs text-slate-600 mb-1">{c.category}{c.landmark ? ` • ${c.landmark}` : ''}</p>
                            <p className="text-xs text-slate-500 mb-2 line-clamp-3">{c.description}</p>
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isEmergency(c) ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                {isEmergency(c) ? 'EMERGENCY' : c.status}
                              </span>
                              <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1">👍 {c.votes || 0}</span>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ) : null
                  ))}
                </MapContainer>
              </div>
            </motion.div>

            {/* List View */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[500px] lg:h-auto overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h2 className="font-bold text-slate-800 text-sm">Nearby Complaints</h2>
                {emergencyComplaints.length > 0 && (
                  <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded border border-red-200 animate-pulse">
                    {emergencyComplaints.length} Emergencies
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {rankedComplaints.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm text-slate-500">
                      {scope === 'nearby' ? 'No active complaints found within 2km.' : 'No active complaints found in Delhi.'}
                    </p>
                  </div>
                ) : (
                  <>
                    {emergencyComplaints.map((c) => (
                      <div key={c._id || c.id} className="border-2 border-red-300 bg-red-50 rounded-xl p-3 shadow-sm relative">
                        <div className="absolute -top-2.5 -right-2.5 bg-red-600 text-white p-1 rounded-full shadow-md animate-bounce">
                          <AlertCircle className="h-4 w-4" />
                        </div>
                        <div className="flex justify-between items-start mb-2 pr-4">
                          <h3 className="font-bold text-sm text-red-900 line-clamp-1" title={c.title}>{c.title}</h3>
                          <span className="text-[10px] font-bold bg-red-200 text-red-800 px-2 py-0.5 rounded border border-red-300">
                            {c.category}
                          </span>
                        </div>
                        {c.image && (
                          <img src={c.image} alt="Evidence" className="w-full h-24 object-cover rounded-lg mb-2 border border-red-200" />
                        )}
                        <p className="text-xs text-red-700/80 line-clamp-2 mb-3 font-medium">{c.description}</p>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-red-700 uppercase tracking-wide">EMERGENCY</span>
                          <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            <ThumbsUp className="h-3 w-3" /> {c.votes || 0}
                          </span>
                        </div>
                      </div>
                    ))}

                    {standardComplaints.map((c) => (
                      <div key={c._id || c.id} className="border border-slate-100 rounded-xl p-3 hover:shadow-md transition-shadow bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-sm text-slate-800 line-clamp-1" title={c.title}>{c.title}</h3>
                          <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                            {c.category}
                          </span>
                        </div>
                        {c.image && (
                          <img src={c.image} alt="Evidence" className="w-full h-24 object-cover rounded-lg mb-2 border border-slate-200" />
                        )}
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{c.description}</p>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">{c.status}</span>
                          <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            <ThumbsUp className="h-3 w-3" /> {c.votes || 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
        </div>
      )}

      {/* All Complaints & Admin Activity (audit trail) */}
      {activeTab === 'oversight' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              Every Complaint & What the Admin Did
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Full oversight of all citizen complaints. Expand any complaint to audit the administrator's exact actions, messages, and timestamps. Flagged closures are highlighted in red.
            </p>
          </div>

          {fetchingReports ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200 rounded-2xl">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-3" />
              <p className="text-sm text-slate-500 font-medium">Loading complaints...</p>
            </div>
          ) : allComplaints.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
              <p className="text-slate-500 font-medium">No complaints in the system yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortByPriority(allComplaints).map((c) => (
                <AdminProcessCard key={c._id || c.id} complaint={c} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Officer Performance & Workload */}
      {activeTab === 'officers' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Officer Performance & Workload
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Live overview of every administrator: performance points (+1 per resolution, −5 per upheld false closure), current active workload (bandwidth), total resolved, and integrity flags. Officers with false closures or negative points are highlighted.
            </p>
          </div>

          {fetchingOfficers ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200 rounded-2xl">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-3" />
              <p className="text-sm text-slate-500 font-medium">Loading officer data...</p>
            </div>
          ) : officers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
              <ShieldCheck className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 font-medium">No officers found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {officers.map((o) => (
                <OfficerCard key={o.id} officer={o} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* False Closure Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              Evaluate Citizen False Closure Claims
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Citizens submit these reports when their issues are closed prematurely by municipal administrators. Your approval will reopen the complaint and penalize the administrator (-5 performance points).
            </p>
          </div>

          {fetchingReports ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200 rounded-2xl">
              <Loader2 className="h-8 w-8 text-red-500 animate-spin mb-3" />
              <p className="text-sm text-slate-500 font-medium">Loading false closure reports...</p>
            </div>
          ) : pendingReports.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-slate-600 font-bold text-base">All clear!</p>
              <p className="text-slate-400 text-sm mt-0.5">No pending false closure reports require review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingReports.map(report => (
                <div key={report._id || report.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="p-5 border-b border-slate-100 flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">#{report.id}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-200">
                        {report.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1">{report.title}</h3>
                    <p className="text-xs text-slate-500 mb-4">{report.description}</p>

                    {/* Evidence & Proof images */}
                    {(report.image || report.proofImage) && (
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {report.image && (
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Citizen Evidence</p>
                            <img src={report.image} alt="Evidence" className="h-20 w-full object-cover rounded-lg border border-slate-100" />
                          </div>
                        )}
                        {report.proofImage && (
                          <div>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Admin Resolution Proof</p>
                            <img src={report.proofImage} alt="Proof" className="h-20 w-full object-cover rounded-lg border border-emerald-100" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Citizen's report explanation */}
                    <div className="p-3.5 bg-red-50/70 border border-red-100 rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">Citizen's False Closure Claim:</span>
                      <p className="text-xs text-red-900 font-medium mt-1 leading-relaxed">
                        "{report.falseClosureReport?.reason}"
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button
                      onClick={() => handleAction(report._id || report.id, 'Approve')}
                      disabled={processingId !== null}
                      className="flex-1 h-9 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      {processingId === (report._id || report.id) ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      Approve Penalty
                    </button>
                    <button
                      onClick={() => handleAction(report._id || report.id, 'Reject')}
                      disabled={processingId !== null}
                      className="flex-1 h-9 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-60 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      {processingId === (report._id || report.id) ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-slate-400" />
                      )}
                      Reject Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Real-time E2E Chat */}
      <SecureChatWidget role="cm" />
    </div>
  );
}
