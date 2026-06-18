import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, ThumbsUp, Crosshair, Loader2, AlertCircle } from 'lucide-react';
import { complaintService } from '../../services/complaintService';
import { useAuth } from '../../context/AuthContext';
import { onComplaintUpdated } from '../../services/socketService';
import { sortByPriority, isEmergency } from '../../utils/complaintSort';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const RESOLVED_STATUSES = ['resolved', 'Resolved'];
const RADIUS_KM = 2;

export function CitizenNearbyMap() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(localStorage.getItem('liveLocationEnabled') === 'true');
  const [location, setLocation] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [votingId, setVotingId] = useState(null);
  const watchIdRef = useRef(null);

  const uid = String(user?._id || '');

  const fetchNearby = useCallback(async (lat, lng) => {
    setLoading(true);
    try {
      const res = await complaintService.getNearbyComplaints(lat, lng, RADIUS_KM);
      const pending = (res.data || []).filter(c => !RESOLVED_STATUSES.includes(c.status));
      setComplaints(pending);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load nearby complaints.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Start / stop live location tracking when toggled
  useEffect(() => {
    if (!enabled) {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation(prev => {
          // Only refetch when the citizen has moved a meaningful amount
          if (!prev || Math.abs(prev.lat - lat) > 0.0005 || Math.abs(prev.lng - lng) > 0.0005) {
            fetchNearby(lat, lng);
          }
          return { lat, lng };
        });
      },
      (err) => {
        console.warn('Live location failed:', err);
        setError('Location access denied. Enable location to see nearby complaints.');
        setLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, fetchNearby]);

  // Live vote/status updates from other users
  useEffect(() => {
    const unsub = onComplaintUpdated((data) => {
      setComplaints(prev => prev.map(c =>
        (c._id === data.complaint._id || c.id === data.complaint.id) ? { ...c, ...data.complaint } : c
      ));
    });
    return unsub;
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem('liveLocationEnabled', String(next));
    if (!next) {
      setComplaints([]);
      setLocation(null);
      setError('');
    }
  };

  const handleVote = async (complaint) => {
    const id = complaint._id || complaint.id;
    setVotingId(id);
    try {
      const res = await complaintService.voteComplaint(id);
      setComplaints(prev => prev.map(c =>
        (c._id === id || c.id === id) ? { ...c, votes: res.data.votes, voters: res.data.voters } : c
      ));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register your vote.');
    } finally {
      setVotingId(null);
    }
  };

  const ranked = sortByPriority(complaints);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header + toggle */}
      <div className="p-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-blue-600" />
            Nearby Issues (2km)
          </h2>
          <button
            onClick={toggle}
            className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full transition-all ${
              enabled ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            <Crosshair className="h-3.5 w-3.5" />
            Live Location {enabled ? 'ON' : 'OFF'}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Vote on pending complaints around you. Most-voted issues rank higher with authorities.
        </p>
      </div>

      {!enabled ? (
        <div className="flex flex-col items-center justify-center text-center py-12 px-4">
          <Crosshair className="h-8 w-8 text-slate-300 mb-2" />
          <p className="text-sm text-slate-500 font-medium">Live Location is off</p>
          <p className="text-xs text-slate-400 mt-1">Turn it on to see and vote on complaints within 2km of you.</p>
        </div>
      ) : (
        <>
          {/* Map */}
          <div className="h-[260px] w-full relative z-0 bg-slate-100">
            {location ? (
              <MapContainer center={[location.lat, location.lng]} zoom={14} scrollWheelZoom={true} className="h-full w-full">
                <TileLayer
                  attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[location.lat, location.lng]}>
                  <Popup>You are here</Popup>
                </Marker>
                <Circle
                  center={[location.lat, location.lng]}
                  radius={RADIUS_KM * 1000}
                  pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.08, weight: 1 }}
                />
                {ranked.map((c) => (
                  c.location?.lat && c.location?.lng ? (
                    <Marker key={c._id || c.id} position={[c.location.lat, c.location.lng]}>
                      <Popup>
                        <div className="max-w-[200px]">
                          <p className="font-bold text-sm mb-0.5">{c.title}</p>
                          <p className="text-xs text-slate-600 mb-1">{c.category}</p>
                          <p className="text-xs font-semibold text-blue-600">{c.votes || 0} votes</p>
                        </div>
                      </Popup>
                    </Marker>
                  ) : null
                ))}
              </MapContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center">
                <Loader2 className="h-6 w-6 text-blue-500 animate-spin mb-2" />
                <p className="text-xs text-slate-400">Detecting your location…</p>
              </div>
            )}
          </div>

          {error && (
            <div className="px-4 py-2 bg-red-50 border-y border-red-100 text-red-600 text-xs flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" /> {error}
            </div>
          )}

          {/* List */}
          <div className="max-h-[320px] overflow-y-auto p-3 space-y-2.5">
            {loading && complaints.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading nearby complaints…</div>
            ) : ranked.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No pending complaints within 2km.</div>
            ) : (
              ranked.map((c) => {
                const id = c._id || c.id;
                const own = uid && String(c.userId) === uid;
                const hasVoted = Array.isArray(c.voters) && c.voters.includes(uid);
                const emergency = isEmergency(c);
                return (
                  <div
                    key={id}
                    className={`rounded-xl p-3 border ${emergency ? 'border-red-300 bg-red-50/60' : 'border-slate-100 bg-white'}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-slate-800 line-clamp-1" title={c.title}>{c.title}</h3>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${
                        emergency ? 'bg-red-100 text-red-700 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {emergency ? 'EMERGENCY' : c.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-2">{c.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">{c.status}</span>
                      <button
                        onClick={() => handleVote(c)}
                        disabled={own || votingId === id}
                        title={own ? 'You cannot vote on your own complaint' : 'Vote for this complaint'}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all disabled:opacity-50 ${
                          hasVoted ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        {votingId === id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsUp className="h-3.5 w-3.5" />}
                        {c.votes || 0}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
