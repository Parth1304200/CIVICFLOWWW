import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { complaintService } from '../services/complaintService';
import { MapPin, AlertCircle, Loader2 } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);

  const emergencyCategories = ['Gas Leakage', 'Building Collapse', 'Electrocution', 'Critical Fire'];
  const emergencyComplaints = complaints.filter(c => emergencyCategories.includes(c.category));
  const standardComplaints = complaints.filter(c => !emergencyCategories.includes(c.category));

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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto py-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <MapPin className="h-8 w-8 text-blue-600" />
          Chief Minister Dashboard
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Viewing complaints within a 2km radius of your current location.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
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
              <h2 className="font-semibold text-slate-800">2km Radius Map</h2>
              <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
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
                      <Marker key={c._id} position={[c.location.lat, c.location.lng]}>
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
              <h2 className="font-semibold text-slate-800">Nearby Complaints</h2>
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
                    <div key={c._id} className="border-2 border-red-300 bg-red-50 rounded-xl p-3 shadow-sm relative">
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
                        <span className="text-red-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                        <span className="font-bold text-red-700 uppercase tracking-wide">
                          EMERGENCY
                        </span>
                      </div>
                    </div>
                  ))}

                  {standardComplaints.map((c) => (
                    <div key={c._id} className="border border-slate-100 rounded-xl p-3 hover:shadow-md transition-shadow bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-sm text-slate-800 line-clamp-1" title={c.title}>{c.title}</h3>
                        <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                          {c.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">{c.description}</p>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
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
      )}

      {/* Real-time E2E Chat */}
      <SecureChatWidget role="cm" />
    </div>
  );
}
