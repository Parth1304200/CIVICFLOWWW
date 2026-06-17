import React, { useState } from 'react';
import { HelpCircle, Mail, PhoneCall, AlertTriangle, CheckCircle, Loader2, Send } from 'lucide-react';

export function HelpSupport() {
  const [complaintId, setComplaintId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!complaintId.trim() || !reason.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setSuccess(false);
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/complaints/${complaintId.trim().toUpperCase()}/false-closure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to submit report. Please verify your Complaint ID is correct and has a "Resolved" status.');
      }

      setSuccess(true);
      setComplaintId('');
      setReason('');
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto w-full animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">Help & Support Hub</h1>
        <p className="text-slate-500 mt-2">Find answers, resolve false complaint closures, or get in touch with our team.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Info & FAQs (Left columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                <PhoneCall className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Helpline Number</h3>
                <p className="text-xs text-slate-400 mt-1">Available Mon-Sat, 9 AM to 6 PM</p>
                <p className="font-black text-lg text-blue-600 mt-2">1800-11-2233</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Email Support</h3>
                <p className="text-xs text-slate-400 mt-1">We aim to reply within 24 hours</p>
                <p className="font-black text-lg text-emerald-600 mt-2 text-wrap break-all">support@civicflow.gov.in</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-slate-400" />
                Frequently Asked Questions
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              <div className="p-6 hover:bg-slate-50/40 transition-colors">
                <h4 className="font-bold text-slate-800 mb-1.5">How do I track my complaint?</h4>
                <p className="text-sm text-slate-500 leading-relaxed">You can track your complaint by navigating to the "My Complaints" section in your dashboard. Each complaint has a status badge indicating its current state (Pending, In Progress, Resolved).</p>
              </div>
              <div className="p-6 hover:bg-slate-50/40 transition-colors">
                <h4 className="font-bold text-slate-800 mb-1.5">What is a False Closure report?</h4>
                <p className="text-sm text-slate-500 leading-relaxed">If an officer marks your complaint as "Resolved" but the issue is not actually fixed (or they uploaded a fake proof image), you can submit a False Closure report. Once approved by the Chief Minister, the complaint is reopened, and the responsible officer is penalized.</p>
              </div>
              <div className="p-6 hover:bg-slate-50/40 transition-colors">
                <h4 className="font-bold text-slate-800 mb-1.5">Can I edit a complaint after submission?</h4>
                <p className="text-sm text-slate-500 leading-relaxed">No, once a complaint is officially lodged, it cannot be edited to maintain integrity. If you have additional details, please file a false closure report if it was prematurely resolved, or submit a new ticket.</p>
              </div>
            </div>
          </div>
        </div>

        {/* False Closure Form (Right column) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm self-start">
          <div className="flex items-center gap-2 mb-4 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="font-black text-lg text-slate-900">Report False Closure</h2>
          </div>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Did an administrator mark your issue as resolved without actually fixing it? Report it here. Your report goes directly to the CM for evaluation.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Complaint ID
              </label>
              <input
                type="text"
                placeholder="E.g., 9F2A4B"
                value={complaintId}
                onChange={(e) => setComplaintId(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full text-sm font-mono font-bold tracking-widest border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all placeholder:font-sans placeholder:tracking-normal placeholder:font-normal"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Reason / Detailed Description
              </label>
              <textarea
                placeholder="Explain why this resolution is incorrect. Please state the current ground reality..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none transition-all placeholder:text-slate-400"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-semibold flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-600 font-semibold flex items-start gap-2">
                <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Report submitted successfully to the CM operations desk!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 mt-4"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting Report...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit False Closure
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
