'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  { value: 'pothole', label: '🕳️ Pothole', sla: '7 days' },
  { value: 'waterlogging', label: '💧 Waterlogging', sla: '3 days' },
  { value: 'garbage', label: '🗑️ Garbage / Dumping', sla: '2 days' },
  { value: 'streetlight', label: '💡 Street Light Out', sla: '5 days' },
  { value: 'sewer', label: '🔧 Sewer / Drainage', sla: '3 days' },
  { value: 'encroachment', label: '🚧 Encroachment', sla: '10 days' },
  { value: 'noise', label: '🔊 Noise Pollution', sla: '2 days' },
  { value: 'critical_gas_leak', label: '🔴 Gas Leak (CRITICAL)', sla: '4 hours' },
  { value: 'critical_electrocution', label: '🔴 Electrocution Risk (CRITICAL)', sla: '4 hours' },
  { value: 'critical_structural', label: '🔴 Structural Collapse (CRITICAL)', sla: '6 hours' },
  { value: 'critical_fire', label: '🔴 Fire Hazard (CRITICAL)', sla: '2 hours' },
  { value: 'other', label: '📌 Other', sla: '7 days' },
];

export default function SubmitComplaintPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    address: '',
    lat: '',
    lng: '',
    ward: '',
    district: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const selectedCat = CATEGORIES.find(c => c.value === form.category);
  const isCritical = form.category.startsWith('critical_');

  function detectLocation() {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        update('lat', lat);
        update('lng', lng);

        // Reverse geocode using Nominatim (free)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          update('address', data.display_name ?? `${lat}, ${lng}`);
          update('district', data.address?.state_district ?? '');
        } catch {
          update('address', `Lat: ${lat}, Lng: ${lng}`);
        }
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category) { setError('Please select a category.'); return; }
    if (!form.address) { setError('Please enter or detect your location.'); return; }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          location: {
            address: form.address.trim(),
            lat: parseFloat(form.lat) || 28.6139,
            lng: parseFloat(form.lng) || 77.209,
            ward: form.ward.trim(),
            district: form.district.trim(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Submission failed'); setLoading(false); return; }

      router.push(`/citizen/track/${data.complaint._id}?submitted=1`);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">File a Complaint</h1>
        <p className="text-slate-500 text-sm mt-1">Describe your issue and we&apos;ll assign it to the right department.</p>
      </div>

      {isCritical && (
        <div className="alert-critical mb-6">
          <span className="text-red-600 text-xl">🚨</span>
          <div>
            <p className="font-semibold text-red-800">Critical Complaint</p>
            <p className="text-sm text-red-700 mt-0.5">
              This will immediately alert the Chief Minister and relevant emergency services. SLA: {selectedCat?.sla}.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div id="submit-error" className="alert-warning mb-4 text-sm text-amber-800">⚠️ {error}</div>
      )}

      <form id="complaint-form" onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Title */}
        <div>
          <label htmlFor="c-title" className="label">Title <span className="text-red-500">*</span></label>
          <input
            id="c-title"
            className="input"
            placeholder="Brief description (e.g. Large pothole on Ring Road near ITO)"
            value={form.title}
            onChange={e => update('title', e.target.value)}
            required
            maxLength={200}
          />
          <p className="text-xs text-slate-400 mt-1">{form.title.length}/200</p>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="c-category" className="label">Category <span className="text-red-500">*</span></label>
          <select
            id="c-category"
            className="input"
            value={form.category}
            onChange={e => update('category', e.target.value)}
            required
          >
            <option value="">Select a category...</option>
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>
                {c.label} (SLA: {c.sla})
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="c-desc" className="label">Detailed Description <span className="text-red-500">*</span></label>
          <textarea
            id="c-desc"
            className="input min-h-[100px] resize-none"
            placeholder="Describe the issue in detail — when you noticed it, how long it has been there, impact on residents..."
            value={form.description}
            onChange={e => update('description', e.target.value)}
            required
            maxLength={2000}
            rows={4}
          />
          <p className="text-xs text-slate-400 mt-1">{form.description.length}/2000</p>
        </div>

        {/* Location */}
        <div>
          <label className="label">Location <span className="text-red-500">*</span></label>
          <div className="flex gap-2 mb-2">
            <input
              id="c-address"
              className="input flex-1"
              placeholder="Full address of the complaint"
              value={form.address}
              onChange={e => update('address', e.target.value)}
              required
            />
            <button
              type="button"
              id="btn-detect-location"
              onClick={detectLocation}
              disabled={geoLoading}
              className="btn-secondary text-xs px-3 whitespace-nowrap"
            >
              {geoLoading ? <span className="spinner w-3 h-3" /> : '📍 Detect'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              id="c-ward"
              className="input text-sm"
              placeholder="Ward (optional)"
              value={form.ward}
              onChange={e => update('ward', e.target.value)}
            />
            <input
              id="c-district"
              className="input text-sm"
              placeholder="District (optional)"
              value={form.district}
              onChange={e => update('district', e.target.value)}
            />
          </div>
          {form.lat && form.lng && (
            <p className="text-xs text-green-600 mt-1.5 font-medium">
              ✓ GPS: {parseFloat(form.lat).toFixed(4)}, {parseFloat(form.lng).toFixed(4)}
            </p>
          )}
        </div>

        {selectedCat && (
          <div className="alert-info text-sm text-blue-800">
            ℹ️ <strong>{selectedCat.label}</strong> complaints are resolved within <strong>{selectedCat.sla}</strong>.
          </div>
        )}

        <button
          id="submit-complaint"
          type="submit"
          className="btn-primary w-full py-3"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <span className="spinner w-4 h-4" />
              Submitting...
            </span>
          ) : '📋 Submit Complaint'}
        </button>
      </form>
    </div>
  );
}
