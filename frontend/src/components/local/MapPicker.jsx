import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

// Delhi Bounds coordinates
const DELHI_BOUNDS = L.latLngBounds([28.40, 76.80], [28.89, 77.35]);

// Pans the map to a coordinate whenever it changes (used for live-location auto-fill)
function RecenterOnPosition({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], Math.max(map.getZoom(), 15));
    }
  }, [position, map]);
  return null;
}

function LocationMarker({ position, setPosition, setError }) {
  useMapEvents({
    click(e) {
      if (DELHI_BOUNDS.contains(e.latlng)) {
        setPosition(e.latlng);
        setError('');
      } else {
        setError('Location selection is restricted to Delhi only.');
      }
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export function MapPicker({ onLocationSelect, initialPosition = null }) {
  const [position, setPosition] = useState(initialPosition);
  const [error, setError] = useState('');

  useEffect(() => {
    if (position) {
      onLocationSelect(position);
    }
  }, [position, onLocationSelect]);

  // Sync an externally supplied position (e.g. live location detected after mount)
  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
    }
  }, [initialPosition]);

  // Center on Delhi
  const defaultCenter = [28.6139, 77.2090];

  const handleAutoDetect = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const detectedLatLng = L.latLng(pos.coords.latitude, pos.coords.longitude);
        if (DELHI_BOUNDS.contains(detectedLatLng)) {
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setError('');
        } else {
          setError('Your auto-detected location is outside Delhi. Please pin location manually.');
        }
      }, (err) => {
        console.warn("Geolocation failed or denied", err);
      });
    }
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
      <div className="h-64 w-full rounded-xl overflow-hidden border border-slate-300 shadow-sm relative z-0">
        <MapContainer
          center={position ? [position.lat, position.lng] : defaultCenter}
          zoom={position ? 15 : 11}
          minZoom={10}
          maxBounds={DELHI_BOUNDS}
          maxBoundsViscosity={1.0}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterOnPosition position={position} />
          <LocationMarker position={position} setPosition={setPosition} setError={setError} />
        </MapContainer>
      </div>
      {position && (
        <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
          📍 Location Pinned: {position.lat.toFixed(6)}, {position.lng.toFixed(6)} (Delhi, India)
        </p>
      )}
    </div>
  );
}
