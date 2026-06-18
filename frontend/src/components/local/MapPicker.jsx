import React, { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default Leaflet marker icons in React/Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DELHI_BOUNDS = L.latLngBounds([28.40, 76.80], [28.89, 77.35]);

/**
 * MapPicker — imperative Leaflet map (no react-leaflet hooks/components).
 *
 * WHY IMPERATIVE:
 * react-leaflet's MapContainer destroys the Leaflet map in a useLayoutEffect
 * (synchronous commit phase). React 19's passive useEffect cleanups on child
 * components run AFTER this, meaning any react-leaflet hook cleanup (useMap,
 * useMapEvents, etc.) fires on an already-dead map object and throws a
 * TypeError that crashes React 19's concurrent scheduler, permanently
 * freezing the page on navigation.
 *
 * By managing the Leaflet map through a plain useRef + useEffect with
 * explicit try-catch cleanup, we fully bypass react-leaflet's lifecycle
 * and React 19's scheduler never sees a thrown exception.
 */
export function MapPicker({ onLocationSelect, initialPosition = null }) {
  const [position, setPosition] = useState(initialPosition);
  const [error, setError]       = useState('');

  const containerRef = useRef(null);  // DOM div for Leaflet
  const mapRef       = useRef(null);  // L.Map instance
  const markerRef    = useRef(null);  // L.Marker instance
  const mountedRef   = useRef(true);  // Guards stale async callbacks

  // ── Create map once on mount; destroy safely on unmount ──────────────────
  useEffect(() => {
    mountedRef.current = true;
    const el = containerRef.current;
    if (!el) return;

    let map;
    try {
      const initCenter = position
        ? [position.lat, position.lng]
        : [28.6139, 77.2090];
      const initZoom = position ? 15 : 11;

      map = L.map(el, {
        center: initCenter,
        zoom: initZoom,
        minZoom: 10,
        maxBounds: DELHI_BOUNDS,
        maxBoundsViscosity: 1.0,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Drop initial marker if a position was passed in
      if (position) {
        markerRef.current = L.marker([position.lat, position.lng]).addTo(map);
      }

      // Click-to-pin handler (guarded against stale refs)
      map.on('click', (e) => {
        if (!mountedRef.current) return;
        try {
          if (DELHI_BOUNDS.contains(e.latlng)) {
            const { lat, lng } = e.latlng;
            if (markerRef.current) {
              markerRef.current.setLatLng([lat, lng]);
            } else {
              markerRef.current = L.marker([lat, lng]).addTo(map);
            }
            setPosition({ lat, lng });
            setError('');
          } else {
            setError('Location selection is restricted to Delhi only.');
          }
        } catch (_) {}
      });

      mapRef.current = map;
    } catch (err) {
      console.error('Leaflet init failed:', err);
    }

    // ── Cleanup: remove all listeners then destroy the map ────────────────
    return () => {
      mountedRef.current = false;
      try { map?.off(); }    catch (_) {}
      try { map?.remove(); } catch (_) {}
      mapRef.current    = null;
      markerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — intentionally once

  // ── Pan map + update marker when position changes ─────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !position) return;
    try {
      if (markerRef.current) {
        markerRef.current.setLatLng([position.lat, position.lng]);
      } else {
        markerRef.current = L.marker([position.lat, position.lng]).addTo(map);
      }
      map.setView([position.lat, position.lng], Math.max(map.getZoom(), 15));
    } catch (_) {}
  }, [position]);

  // ── Notify parent whenever position changes ───────────────────────────────
  useEffect(() => {
    if (position) onLocationSelect(position);
  }, [position, onLocationSelect]);

  // ── Sync externally supplied position (live-location auto-fill) ───────────
  useEffect(() => {
    if (initialPosition) setPosition(initialPosition);
  }, [initialPosition]);

  // ── Auto-detect button handler ────────────────────────────────────────────
  const handleAutoDetect = () => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ll = L.latLng(pos.coords.latitude, pos.coords.longitude);
        if (DELHI_BOUNDS.contains(ll)) {
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setError('');
        } else {
          setError('Your auto-detected location is outside Delhi. Please pin location manually.');
        }
      },
      (err) => console.warn('Geolocation failed or denied', err)
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        {error && (
          <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-150 animate-pulse">
            ⚠️ {error}
          </span>
        )}
        <button
          type="button"
          onClick={handleAutoDetect}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium ml-auto"
        >
          Auto-detect My Location
        </button>
      </div>

      {/* Leaflet mounts into this plain div — no react-leaflet wrappers */}
      <div
        ref={containerRef}
        className="h-52 w-full rounded-xl border border-slate-300 shadow-sm overflow-hidden"
        style={{ position: 'relative', zIndex: 0 }}
      />

      {position && (
        <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
          📍 Location Pinned: {position.lat.toFixed(6)}, {position.lng.toFixed(6)} (Delhi, India)
        </p>
      )}
    </div>
  );
}
