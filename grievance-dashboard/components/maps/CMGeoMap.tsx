'use client';

import { useEffect, useRef } from 'react';

interface Complaint {
  _id: string;
  ticketId: string;
  title: string;
  status: string;
  isCritical: boolean;
  location: { lat: number; lng: number; address: string };
  distanceKm?: number;
}

interface Props {
  center: { lat: number; lng: number };
  complaints: Complaint[];
  radiusKm: number;
}

export default function CMGeoMap({ center, complaints, radiusKm }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let L: any;
    try {
      L = require('leaflet');
      require('leaflet/dist/leaflet.css');
    } catch {
      return;
    }

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: 14,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // 2km radius circle
    L.circle([center.lat, center.lng], {
      radius: radiusKm * 1000,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.06,
      weight: 1.5,
      dashArray: '4 4',
    }).addTo(map);

    // CM location marker
    const cmIcon = L.divIcon({
      html: `<div style="
        width:16px;height:16px;
        background:#1d4ed8;border:3px solid white;border-radius:50%;
        box-shadow:0 0 0 3px #1d4ed8,0 2px 8px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      className: '',
    });

    L.marker([center.lat, center.lng], { icon: cmIcon })
      .addTo(map)
      .bindPopup('<strong>📍 CM Current Location</strong>');

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update complaint markers when data changes
  useEffect(() => {
    if (!mapRef.current) return;

    let L: any;
    try { L = require('leaflet'); } catch { return; }

    const map = mapRef.current;

    // Remove old complaint markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    complaints.forEach(c => {
      const color = c.isCritical
        ? '#ef4444'
        : ['resolved', 'closed'].includes(c.status)
        ? '#22c55e'
        : '#f59e0b';

      const icon = L.divIcon({
        html: `<div style="
          width:12px;height:12px;
          background:${color};border:2px solid white;border-radius:50%;
          box-shadow:0 1px 4px rgba(0,0,0,0.3);
          ${c.isCritical ? 'animation:none;' : ''}
        "></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
        className: '',
      });

      const popup = `
        <div style="min-width:160px">
          <p style="font-weight:700;font-size:12px;margin:0 0 4px">${c.ticketId}</p>
          <p style="font-size:11px;margin:0 0 2px;color:#374151">${c.title}</p>
          <p style="font-size:10px;color:#6b7280;margin:0 0 4px">${c.location.address}</p>
          <span style="display:inline-block;padding:2px 6px;border-radius:12px;background:${color}22;color:${color};font-size:10px;font-weight:600">
            ${c.status.replace(/_/g, ' ')}
          </span>
          ${c.distanceKm !== undefined ? `<p style="font-size:10px;color:#9ca3af;margin:4px 0 0">${c.distanceKm.toFixed(2)} km away</p>` : ''}
        </div>
      `;

      const marker = L.marker([c.location.lat, c.location.lng], { icon })
        .addTo(map)
        .bindPopup(popup);

      markersRef.current.push(marker);
    });
  }, [complaints]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
      className="bg-slate-100"
    />
  );
}
