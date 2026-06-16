import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import {
  MapPin, Image as ImageIcon, X, CheckCircle2,
  PlusCircle, ClipboardList, AlertTriangle, Wifi, RefreshCw
} from 'lucide-react';
import { complaintService } from '../services/complaintService';
import { MapPicker } from '../components/local/MapPicker';
import exifr from 'exifr';

// Haversine formula to calculate distance in meters
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ──────────────────────────────────────────────
// Success Screen
// ──────────────────────────────────────────────
function SuccessScreen({ submittedTitle, onSubmitAnother, onViewComplaints }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center text-center max-w-md mx-auto py-12 px-4"
    >
      {/* Animated check */}
      <div className="relative mb-6">
        <div className="h-24 w-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 12 }}
          >
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </motion.div>
        </div>
        {/* Ripple rings */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-emerald-300"
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 1.8 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-2xl font-black text-slate-900 mb-2">
          Complaint Submitted! 🎉
        </h2>
        {submittedTitle && (
          <p className="text-sm font-medium text-slate-500 mb-1">
            "<span className="text-slate-700">{submittedTitle}</span>"
          </p>
        )}
        <p className="text-sm text-slate-500 leading-relaxed mt-2 max-w-xs mx-auto">
          Your complaint has been successfully registered. You can track its status in real time from your My Complaints page.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mt-8 flex flex-col gap-3 w-full max-w-xs"
      >
        <button
          onClick={onViewComplaints}
          className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <ClipboardList className="h-4 w-4" />
          Track My Complaint
        </button>
        <button
          onClick={onSubmitAnother}
          className="w-full h-11 rounded-xl border-2 border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all flex items-center justify-center gap-2"
        >
          <PlusCircle className="h-4 w-4 text-blue-500" />
          Submit Another Complaint
        </button>
      </motion.div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────
// Error Banner
// ──────────────────────────────────────────────
function ErrorBanner({ error, onRetry }) {
  const is502 = error.includes('502') || error.includes('Network Error') || error.includes('unavailable') || error.includes('ERR_');
  const isAuth = error.includes('401') || error.includes('log in') || error.includes('token');

  return (
    <div className={`mb-5 rounded-xl border px-4 py-3.5 flex gap-3 items-start text-sm ${
      is502 ? 'bg-orange-50 border-orange-200 text-orange-800' :
      isAuth ? 'bg-violet-50 border-violet-200 text-violet-800' :
               'bg-red-50 border-red-200 text-red-700'
    }`}>
      <div className="flex-shrink-0 mt-0.5">
        {is502 ? <Wifi className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      </div>
      <div className="flex-1">
        {is502 ? (
          <>
            <p className="font-semibold">Server Unreachable</p>
            <p className="text-xs mt-0.5 opacity-80">
              The backend server is not running or the database is unavailable.
              Please make sure the server is started with <code className="bg-orange-100 px-1 rounded">npm run dev</code> and that your MongoDB Atlas IP is whitelisted.
            </p>
          </>
        ) : isAuth ? (
          <>
            <p className="font-semibold">Session Expired</p>
            <p className="text-xs mt-0.5 opacity-80">Your session has expired. Please log in again to submit a complaint.</p>
          </>
        ) : (
          <p>{error}</p>
        )}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold underline underline-offset-2 hover:opacity-70"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────
const EMPTY_FORM = {
  title: '',
  category: '',
  location: null,
  description: '',
  landmark: '',
  occurrenceDate: '',
  urgency: '',
  impactScale: '',
  contactPreference: ''
};

export function SubmitComplaint() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittedTitle, setSubmittedTitle] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [mapKey, setMapKey] = useState(0); // used to remount MapPicker on reset

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setFile(null);
    setPreview('');
    setError('');
    setSubmitted(false);
    setSubmittedTitle('');
    setMapKey(k => k + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!file) {
        setError('A geotagged photo is mandatory for all submissions.');
        setLoading(false);
        return;
      }
      
      if (!formData.location) {
        setError('Please pin the location on the map.');
        setLoading(false);
        return;
      }

      try {
        const exifData = await exifr.parse(file);
        if (!exifData || !exifData.latitude || !exifData.longitude) {
          setError('The uploaded photo does not contain GPS location data. Please enable location tags on your camera and take a new photo.');
          setLoading(false);
          return;
        }

        const distance = getDistance(exifData.latitude, exifData.longitude, formData.location.lat, formData.location.lng);
        if (distance > 500) {
          setError(`The photo's location is ${Math.round(distance)} meters away from the pinned map location. They must be within 500 meters of each other.`);
          setLoading(false);
          return;
        }
      } catch(err) {
        setError('Failed to extract GPS data from the photo. Make sure it is an original photo from your camera.');
        setLoading(false);
        return;
      }

      const data = new FormData();
      data.append('title', formData.title);
      data.append('category', formData.category);
      data.append('location', JSON.stringify(formData.location));
      data.append('description', formData.description);
      data.append('landmark', formData.landmark);
      data.append('occurrenceDate', formData.occurrenceDate);
      data.append('urgency', formData.urgency);
      data.append('impactScale', formData.impactScale);
      data.append('contactPreference', formData.contactPreference);
      data.append('image', file);

      await complaintService.submitComplaint(data);

      setSubmittedTitle(formData.title);
      setSubmitted(true);

      // Auto-redirect after 8 seconds (gives user time to read and choose)
      const role = localStorage.getItem('role');
      if (role === 'admin') {
        setTimeout(() => navigate('/admin'), 8000);
      }
      // Citizens stay here so they can see the buttons

    } catch (err) {
      console.error('Complaint submission failed:', err);
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message || 'Failed to submit complaint';

      if (status === 502 || status === 503 || err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        setError('502 — Server Unreachable. The backend is not running or the database is unavailable.');
      } else if (status === 401) {
        setError('401 — You are not logged in. Please log in again to submit.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview('');
  };

  // ── Success state — show full-page confirmation ──
  if (submitted) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Submit Complaint</h1>
          <p className="mt-1 text-sm text-slate-500">Report a public issue directly to the concerned authority.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <SuccessScreen
            submittedTitle={submittedTitle}
            onSubmitAnother={resetForm}
            onViewComplaints={() => navigate('/complaints')}
          />
        </div>
      </div>
    );
  }

  // ── Form state ──
  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Submit New Complaint</h1>
        <p className="mt-1 text-sm text-slate-500">Report a public issue directly to the concerned authority.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm"
      >
        {/* Error Banner */}
        {error && (
          <ErrorBanner
            error={error}
            onRetry={() => setError('')}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
                Issue Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Pothole on main street"
                required
              />
            </div>

            {/* Landmark / Street Address */}
            <div>
              <label htmlFor="landmark" className="block text-sm font-medium text-slate-700 mb-1">
                Concerned Landmark / Street Address <span className="text-red-500">*</span>
              </label>
              <Input
                id="landmark"
                value={formData.landmark}
                onChange={handleChange}
                placeholder="e.g., Near Metro Station, opposite ABC Store"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={handleChange}
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              >
                <option value="" disabled>Select a category</option>
                <optgroup label="Emergency">
                  <option value="Gas Leakage">Gas Leakage</option>
                  <option value="Building Collapse">Building Collapse</option>
                  <option value="Electrocution">Electrocution</option>
                  <option value="Critical Fire">Critical Fire</option>
                </optgroup>
                <optgroup label="Standard">
                  <option value="Roads & Infrastructure">Roads &amp; Infrastructure</option>
                  <option value="Utilities">Utilities (Water, Electricity)</option>
                  <option value="Environment">Environment &amp; Sanitation</option>
                  <option value="Noise">Noise Disturbance</option>
                  <option value="Vandalism">Vandalism &amp; Security</option>
                  <option value="Other">Other</option>
                </optgroup>
              </select>
            </div>

            {/* Urgency and Occurrence Date & Time Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="urgency" className="block text-sm font-medium text-slate-700 mb-1">
                  Urgency Level <span className="text-red-500">*</span>
                </label>
                <select
                  id="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="" disabled>Select urgency</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label htmlFor="occurrenceDate" className="block text-sm font-medium text-slate-700 mb-1">
                  Date &amp; Time Noticed <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="occurrenceDate"
                  value={formData.occurrenceDate}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700"
                  required
                />
              </div>
            </div>

            {/* Impact Scale and Contact Preference Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="impactScale" className="block text-sm font-medium text-slate-700 mb-1">
                  Impact / Scale of Issue <span className="text-red-500">*</span>
                </label>
                <select
                  id="impactScale"
                  value={formData.impactScale}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="" disabled>Select impact scale</option>
                  <option value="Individual">Individual (Only affects me)</option>
                  <option value="Few neighbors">Few neighbors</option>
                  <option value="Whole street/community">Whole street/community</option>
                </select>
              </div>

              <div>
                <label htmlFor="contactPreference" className="block text-sm font-medium text-slate-700 mb-1">
                  Contact Preference <span className="text-red-500">*</span>
                </label>
                <select
                  id="contactPreference"
                  value={formData.contactPreference}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="" disabled>Select contact preference</option>
                  <option value="Email">Email</option>
                  <option value="Phone">Phone Call</option>
                  <option value="SMS">SMS Message</option>
                </select>
              </div>
            </div>

            {/* Map */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Pinpoint Location on Map
              </label>
              <div className="h-[220px] w-full rounded-lg border border-slate-300 overflow-hidden relative z-0">
                <MapPicker
                  key={mapKey}
                  onLocationSelect={(loc) => setFormData(prev => ({ ...prev, location: loc }))}
                />
              </div>
              {formData.location ? (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Location pinned: {formData.location.lat?.toFixed(5)}, {formData.location.lng?.toFixed(5)}
                </p>
              ) : (
                <p className="text-xs text-amber-600 mt-1">Click on the map to drop a pin and record exact coordinates.</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                Detailed Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Describe the issue in detail — when it started, how it's affecting the area..."
                required
              />
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Evidence Photo <span className="text-red-500">* (Geotag required)</span></label>
              {!preview ? (
                <label
                  htmlFor="file-upload"
                  className="mt-1 flex flex-col items-center justify-center px-6 pt-6 pb-7 border-2 border-slate-300 border-dashed rounded-xl hover:bg-slate-50 hover:border-blue-400 transition-all cursor-pointer"
                >
                  <ImageIcon className="mx-auto h-10 w-10 text-slate-400 mb-2" />
                  <span className="text-sm font-medium text-blue-600">Click to upload</span>
                  <span className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                </label>
              ) : (
                <div className="relative mt-1 inline-block">
                  <img src={preview} alt="Evidence preview" className="h-40 w-auto rounded-xl object-cover border border-slate-200 shadow-sm" />
                  <button
                    type="button"
                    onClick={clearFile}
                    className="absolute -top-3 -right-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-full p-1.5 transition-colors shadow-sm"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="h-10 px-5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold shadow-sm transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting...
                </>
              ) : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
