import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { complaintService } from '../services/complaintService';
import { MapPin, AlertCircle, Loader2, ShieldAlert, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { SecureChatWidget } from '../components/local/SecureChatWidget';
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

export function CMDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [allComplaints, setAllComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingReports, setFetchingReports] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  
  const [activeTab, setActiveTab] = useState('nearby'); // 'nearby' or 'reports'
  const [processingId, setProcessingId] = useState(null);

  const emergencyCategories = ['Gas Leakage', 'Building Collapse', 'Electrocution', 'Critical Fire'];
  const emergencyComplaints = complaints.filter(c => emergencyCategories.includes(c.category));
  const standardComplaints = complaints.filter(c => !emergencyCategories.includes(c.category));

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

  useEffect(() => {
    fetchAllComplaints();
  }, []);

  const handleAction = async (id, action) => {
    setProcessingId(id);
    try {
      await complaintService.handleFalseClosure(id, action);
      // Refresh complaints
      await fetchAllComplaints();
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
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('nearby')}
          className={`pb-3 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'nearby'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Nearby Map & Feed
        </button>
        <button
          onClick={() => {
            setActiveTab('reports');
            fetchAllComplaints();
          }}
          className={`pb-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
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
      {activeTab === 'nearby' ? (
        loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Detecting location and fetching data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-6 rounded-xl flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p className="font-semibold">{error}</p>
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
                <h2 className="font-bold text-slate-800 text-sm">2km Radius Map</h2>
                <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                  {complaints.length} active issues
                </span>
              </div>
              <div className="h-[500px] w-full relative z-0">
                {location && (
                  <MapContainer
                    center={[location.lat, location.lng]}
                    zoom={14}
                    scrollWheelZoom={true}
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* CM Location Marker */}
                    <Marker position={[location.lat, location.lng]}>
                      <Popup>
                        <div className="text-center">
                          <p className="font-bold text-blue-700">Your Location</p>
                          <p className="text-xs text-slate-500">Center of 2km radius</p>
                        </div>
                      </Popup>
                    </Marker>

                    {/* 2km Radius Circle */}
                    <Circle
                      center={[location.lat, location.lng]}
                      radius={2000} // in meters
                      pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1, weight: 1 }}
                    />

                    {/* Complaints Markers */}
                    {complaints.map((c) => (
                      c.location?.lat && c.location?.lng ? (
                        <Marker key={c._id || c.id} position={[c.location.lat, c.location.lng]}>
                          <Popup>
                            <div className="max-w-[200px]">
                              <p className="font-bold text-sm mb-1">{c.title}</p>
                              <p className="text-xs text-slate-600 mb-2">{c.category}</p>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                {c.status}
                              </span>
                            </div>
                          </Popup>
                        </Marker>
                      ) : null
                    ))}
                  </MapContainer>
                )}
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
                {complaints.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm text-slate-500">No active complaints found within 2km.</p>
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
                        <p className="text-xs text-red-700/80 line-clamp-2 mb-3 font-medium">{c.description}</p>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-red-500">{new Date(c.createdAt || c.date).toLocaleDateString()}</span>
                          <span className="font-bold text-red-700 uppercase tracking-wide">
                            EMERGENCY
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
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{c.description}</p>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">{new Date(c.createdAt || c.date).toLocaleDateString()}</span>
                          <span className="font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                            {c.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )
      ) : (
        /* False Closure Tab */
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
