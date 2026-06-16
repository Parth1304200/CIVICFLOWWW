'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import StatusTimeline from '@/components/ui/StatusTimeline';
import Link from 'next/link';

interface Complaint {
  _id: string;
  ticketId: string;
  title: string;
  description: string;
  category: string;
  status: string;
  isCritical: boolean;
  location: { address: string; lat: number; lng: number; ward?: string; district?: string };
  statusHistory: { status: string; note: string; timestamp: string }[];
  assignedTo?: { name: string; department: string; phone: string; accountabilityScore: number; tier: string };
  submittedBy: { name: string; email: string };
  citizenRating?: number;
  isDisputed: boolean;
  proofPhotoUrl?: string;
  slaDeadline: string;
  slaBreached: boolean;
  cpgramsRef?: string;
  createdAt: string;
}

const TIER_BADGE: Record<string, string> = {
  excellent: 'badge-green',
  good: 'badge-blue',
  at_risk: 'badge-yellow',
  flagged: 'badge-red',
};

export default function TrackPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const justSubmitted = searchParams.get('submitted') === '1';

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [dispute, setDispute] = useState('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeSuccess, setDisputeSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/complaints/${id}`)
      .then(r => r.json())
      .then(data => { setComplaint(data.complaint); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  async function submitRating() {
    if (!rating || !complaint) return;
    await fetch(`/api/complaints/${complaint._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ citizenRating: rating, citizenFeedback: feedback }),
    });
    setRatingSubmitted(true);
  }

  async function submitDispute(e: React.FormEvent) {
    e.preventDefault();
    if (!complaint) return;
    setDisputeSubmitting(true);
    const res = await fetch(`/api/complaints/${complaint._id}/dispute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: dispute }),
    });
    if (res.ok) { setDisputeSuccess(true); setComplaint(prev => prev ? { ...prev, isDisputed: true, status: 'disputed' } : prev); }
    setDisputeSubmitting(false);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-5 w-72" />
        <div className="card p-6 space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-12" />)}
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-slate-500">Complaint not found.</p>
        <Link href="/citizen/dashboard" className="btn-primary mt-4 text-sm">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const slaDate = new Date(complaint.slaDeadline);
  const now = new Date();
  const hoursLeft = Math.round((slaDate.getTime() - now.getTime()) / (1000 * 60 * 60));

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      {justSubmitted && (
        <div className="alert-info mb-5 animate-fade-in">
          ✅ <span className="font-semibold text-blue-800">Complaint submitted successfully!</span>
          <span className="text-blue-700"> Ticket ID: <code className="font-mono bg-blue-100 px-1 rounded">{complaint.ticketId}</code></span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <p className="text-xs text-slate-400 font-mono">{complaint.ticketId}</p>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">{complaint.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{complaint.location.address}</p>
        </div>
        <Link href="/citizen/dashboard" className="btn-ghost text-xs">← Back</Link>
      </div>

      {complaint.isCritical && (
        <div className="alert-critical mb-4">
          <span className="text-red-600 text-xl">🚨</span>
          <div>
            <p className="font-semibold text-red-800">Critical — Escalated to CM</p>
            <p className="text-sm text-red-700">The Chief Minister has been notified. Emergency response dispatched.</p>
          </div>
        </div>
      )}

      {/* SLA Banner */}
      {!['resolved', 'closed', 'escalated_to_cm'].includes(complaint.status) && (
        <div className={`p-3 rounded-xl mb-4 text-sm flex items-center gap-2 ${
          complaint.slaBreached
            ? 'bg-red-50 text-red-700 border border-red-200'
            : hoursLeft <= 24
            ? 'bg-amber-50 text-amber-700 border border-amber-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          <span>{complaint.slaBreached ? '⚠️ SLA Breached' : hoursLeft <= 24 ? '⏳ Due Soon' : '🟢 On Track'}</span>
          <span className="text-xs">
            {complaint.slaBreached
              ? 'Resolution overdue — complaint auto-flagged.'
              : `Due by ${slaDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
          </span>
        </div>
      )}

      {/* Status Timeline */}
      <div className="card p-6 mb-4">
        <h2 className="font-semibold text-slate-900 mb-5">Progress</h2>
        <StatusTimeline
          currentStatus={complaint.status}
          history={complaint.statusHistory}
          isDisputed={complaint.isDisputed}
          proofPhotoUrl={complaint.proofPhotoUrl}
        />
      </div>

      {/* Assigned Officer */}
      {complaint.assignedTo && (
        <div className="card p-5 mb-4">
          <h2 className="font-semibold text-slate-900 mb-3 text-sm uppercase tracking-wide">Assigned Officer</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">{complaint.assignedTo.name}</p>
              <p className="text-sm text-slate-500">{complaint.assignedTo.department}</p>
              <a href={`tel:${complaint.assignedTo.phone}`} className="text-sm text-blue-600 hover:underline">
                {complaint.assignedTo.phone}
              </a>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{complaint.assignedTo.accountabilityScore}</p>
              <span className={TIER_BADGE[complaint.assignedTo.tier] ?? 'badge-gray'}>
                {complaint.assignedTo.tier}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="card p-5 mb-4">
        <h2 className="font-semibold text-slate-900 mb-2 text-sm uppercase tracking-wide">Description</h2>
        <p className="text-sm text-slate-600 leading-relaxed">{complaint.description}</p>
      </div>

      {/* CPGRAMS Ref */}
      {complaint.cpgramsRef && (
        <div className="card p-4 mb-4 flex items-center gap-3">
          <span className="text-blue-600">🔗</span>
          <div>
            <p className="text-xs text-slate-500">CPGRAMS Reference</p>
            <p className="text-sm font-mono font-semibold text-slate-900">{complaint.cpgramsRef}</p>
          </div>
        </div>
      )}

      {/* Citizen Rating */}
      {['resolved', 'closed'].includes(complaint.status) && !complaint.isDisputed && (
        <div className="card p-5 mb-4">
          <h2 className="font-semibold text-slate-900 mb-3 text-sm uppercase tracking-wide">Rate This Resolution</h2>
          {complaint.citizenRating || ratingSubmitted ? (
            <p className="text-green-700 font-medium text-sm">
              ✓ You rated this {complaint.citizenRating ?? rating}/5. Thank you!
            </p>
          ) : (
            <div>
              <div className="flex gap-2 mb-3">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    id={`rating-star-${n}`}
                    onClick={() => setRating(n)}
                    className={`text-2xl transition-transform hover:scale-110 ${n <= rating ? 'opacity-100' : 'opacity-30'}`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <textarea
                className="input text-sm resize-none"
                rows={2}
                placeholder="Optional feedback..."
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
              />
              <button
                id="submit-rating"
                onClick={submitRating}
                disabled={!rating}
                className="btn-primary text-sm mt-3 disabled:opacity-50"
              >
                Submit Rating
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dispute Form */}
      {['resolved', 'closed'].includes(complaint.status) && !complaint.isDisputed && !disputeSuccess && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-2 text-sm uppercase tracking-wide">Challenge This Resolution</h2>
          <p className="text-xs text-slate-500 mb-3">
            If the complaint was falsely closed without actual resolution, file a dispute. A supervisor will re-investigate.
          </p>
          <form onSubmit={submitDispute} className="space-y-3">
            <textarea
              id="dispute-reason"
              className="input resize-none text-sm"
              rows={3}
              placeholder="Explain why you believe this was falsely closed (min. 10 characters)..."
              value={dispute}
              onChange={e => setDispute(e.target.value)}
              required
              minLength={10}
            />
            <button
              id="submit-dispute"
              type="submit"
              className="btn-danger text-sm"
              disabled={disputeSubmitting || dispute.length < 10}
            >
              {disputeSubmitting ? <span className="spinner w-3 h-3" /> : '⚖️ File Dispute'}
            </button>
          </form>
        </div>
      )}

      {disputeSuccess && (
        <div className="alert-warning mt-4">
          ⚖️ <span className="font-semibold text-amber-800">Dispute filed.</span>
          <span className="text-amber-700 text-sm"> A supervisor will re-investigate within 48 hours.</span>
        </div>
      )}
    </div>
  );
}
