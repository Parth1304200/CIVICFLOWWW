'use client';

import { useEffect, useState, useCallback } from 'react';
import ComplaintTable from '@/components/dashboard/ComplaintTable';

interface Complaint {
  _id: string;
  ticketId: string;
  title: string;
  category: string;
  status: string;
  isCritical: boolean;
  location: { address: string; district?: string };
  submittedBy?: { name: string };
  assignedTo?: { name: string; department: string };
  createdAt: string;
  slaDeadline: string;
  slaBreached: boolean;
  citizenRating?: number;
}

interface Officer {
  _id: string;
  name: string;
  department: string;
  activeComplaintsCount: number;
  maxCapacity: number;
  isSuspended: boolean;
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '', isCritical: '' });
  const [assignModal, setAssignModal] = useState<{ complaintId: string; visible: boolean } | null>(null);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (filters.status) params.set('status', filters.status);
    if (filters.category) params.set('category', filters.category);
    if (filters.isCritical) params.set('isCritical', filters.isCritical);

    const res = await fetch(`/api/complaints?${params}`);
    const data = await res.json();
    setComplaints(data.complaints ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, filters]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  useEffect(() => {
    fetch('/api/officers').then(r => r.json()).then(d => setOfficers(d.officers ?? []));
  }, []);

  async function handleStatusUpdate(id: string, status: string) {
    await fetch(`/api/complaints/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note: `Status updated by admin.` }),
    });
    fetchComplaints();
  }

  async function handleAssign(complaintId: string, officerId: string) {
    await fetch(`/api/complaints/${complaintId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedTo: officerId, status: 'assigned', note: 'Assigned by admin.' }),
    });
    setAssignModal(null);
    fetchComplaints();
  }

  const pages = Math.ceil(total / 20);

  return (
    <div className="animate-slide-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Complaints</h1>
        <p className="text-slate-500 text-sm mt-1">{total} total complaints</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap mb-4">
        <select
          id="filter-status"
          className="input w-auto text-sm"
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
        >
          <option value="">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="disputed">Disputed</option>
          <option value="closed">Closed</option>
          <option value="escalated_to_cm">Escalated to CM</option>
        </select>
        <select
          id="filter-category"
          className="input w-auto text-sm"
          value={filters.category}
          onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
        >
          <option value="">All Categories</option>
          <option value="pothole">Pothole</option>
          <option value="waterlogging">Waterlogging</option>
          <option value="garbage">Garbage</option>
          <option value="streetlight">Street Light</option>
          <option value="sewer">Sewer</option>
          <option value="encroachment">Encroachment</option>
          <option value="noise">Noise</option>
          <option value="other">Other</option>
        </select>
        <select
          id="filter-critical"
          className="input w-auto text-sm"
          value={filters.isCritical}
          onChange={e => setFilters(f => ({ ...f, isCritical: e.target.value }))}
        >
          <option value="">All Priority</option>
          <option value="true">Critical Only</option>
        </select>
        <button
          id="reset-filters"
          onClick={() => setFilters({ status: '', category: '', isCritical: '' })}
          className="btn-ghost text-sm"
        >
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="card p-1 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12" />)}
          </div>
        ) : (
          <ComplaintTable
            complaints={complaints}
            showActions={true}
            onAssign={id => setAssignModal({ complaintId: id, visible: true })}
            onUpdateStatus={handleStatusUpdate}
          />
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-500">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button
              id="prev-page"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              ← Previous
            </button>
            <button
              id="next-page"
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignModal?.visible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setAssignModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-slate-900 mb-4">Assign Officer</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {officers.filter(o => !o.isSuspended && o.activeComplaintsCount < o.maxCapacity).map(o => (
                <button
                  key={o._id}
                  id={`assign-officer-${o._id}`}
                  onClick={() => handleAssign(assignModal.complaintId, o._id)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <p className="font-medium text-sm text-slate-900">{o.name}</p>
                  <p className="text-xs text-slate-500">{o.department} · {o.activeComplaintsCount}/{o.maxCapacity} cases</p>
                </button>
              ))}
              {officers.filter(o => !o.isSuspended && o.activeComplaintsCount < o.maxCapacity).length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No available officers.</p>
              )}
            </div>
            <button id="close-assign-modal" onClick={() => setAssignModal(null)} className="btn-ghost w-full mt-4 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
