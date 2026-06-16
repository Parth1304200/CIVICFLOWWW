'use client';

import { useEffect, useState, useCallback } from 'react';
import OfficerCard from '@/components/dashboard/OfficerCard';

interface Officer {
  _id: string;
  name: string;
  employeeId: string;
  department: string;
  ward?: string;
  phone?: string;
  activeComplaintsCount: number;
  maxCapacity: number;
  accountabilityScore: number;
  tier: 'excellent' | 'good' | 'at_risk' | 'flagged';
  isSuspended: boolean;
  suspendedReason?: string;
  userId?: { name: string; email: string; lastLogin?: string };
}

const DEPARTMENTS = ['PWD', 'MCD', 'BSES', 'Delhi Jal Board', 'Delhi Police', 'Fire Services', 'Other'];

export default function OfficersPage() {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ tier: '', department: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', employeeId: '', department: '', ward: '', phone: '', maxCapacity: '10' });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const fetchOfficers = useCallback(() => {
    const params = new URLSearchParams();
    if (filter.tier) params.set('tier', filter.tier);
    if (filter.department) params.set('department', filter.department);
    fetch(`/api/officers?${params}`)
      .then(r => r.json())
      .then(d => { setOfficers(d.officers ?? []); setLoading(false); });
  }, [filter]);

  useEffect(() => { fetchOfficers(); }, [fetchOfficers]);

  async function handleAddOfficer(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');
    const res = await fetch('/api/officers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...addForm, maxCapacity: parseInt(addForm.maxCapacity) }),
    });
    const data = await res.json();
    if (!res.ok) { setAddError(data.error ?? 'Failed to add officer'); setAddLoading(false); return; }
    setShowAddForm(false);
    setAddForm({ name: '', email: '', password: '', employeeId: '', department: '', ward: '', phone: '', maxCapacity: '10' });
    fetchOfficers();
    setAddLoading(false);
  }

  const stats = {
    total: officers.length,
    excellent: officers.filter(o => o.tier === 'excellent').length,
    atRisk: officers.filter(o => o.tier === 'at_risk').length,
    suspended: officers.filter(o => o.isSuspended).length,
  };

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Officers</h1>
          <p className="text-slate-500 text-sm mt-1">{officers.length} field officers</p>
        </div>
        <button
          id="btn-add-officer"
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
        >
          + Add Officer
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-900' },
          { label: 'Excellent', value: stats.excellent, color: 'text-emerald-600' },
          { label: 'At Risk', value: stats.atRisk, color: 'text-amber-600' },
          { label: 'Suspended', value: stats.suspended, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <p className={`stat-value ${s.color}`}>{s.value}</p>
            <p className="stat-label">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Add Officer Form */}
      {showAddForm && (
        <div className="card p-6 mb-6 border-blue-200 animate-slide-up">
          <h2 className="font-bold text-slate-900 mb-4">Add New Officer</h2>
          {addError && <div className="alert-warning mb-3 text-sm text-amber-800">⚠️ {addError}</div>}
          <form id="add-officer-form" onSubmit={handleAddOfficer} className="grid grid-cols-2 gap-4">
            <div><label className="label">Full Name *</label><input className="input" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} required /></div>
            <div><label className="label">Email *</label><input type="email" className="input" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} required /></div>
            <div><label className="label">Password *</label><input type="password" className="input" minLength={8} value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} required /></div>
            <div><label className="label">Employee ID *</label><input className="input" value={addForm.employeeId} onChange={e => setAddForm(f => ({ ...f, employeeId: e.target.value }))} required /></div>
            <div>
              <label className="label">Department *</label>
              <select className="input" value={addForm.department} onChange={e => setAddForm(f => ({ ...f, department: e.target.value }))} required>
                <option value="">Select...</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div><label className="label">Ward</label><input className="input" value={addForm.ward} onChange={e => setAddForm(f => ({ ...f, ward: e.target.value }))} /></div>
            <div><label className="label">Phone</label><input className="input" value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><label className="label">Max Capacity</label><input type="number" className="input" min={1} max={50} value={addForm.maxCapacity} onChange={e => setAddForm(f => ({ ...f, maxCapacity: e.target.value }))} /></div>
            <div className="col-span-2 flex gap-3">
              <button id="add-officer-submit" type="submit" className="btn-primary" disabled={addLoading}>
                {addLoading ? <span className="spinner w-4 h-4" /> : 'Create Officer Account'}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select id="filter-tier" className="input w-auto text-sm" value={filter.tier} onChange={e => setFilter(f => ({ ...f, tier: e.target.value }))}>
          <option value="">All Tiers</option>
          <option value="excellent">Excellent</option>
          <option value="good">Good</option>
          <option value="at_risk">At Risk</option>
          <option value="flagged">Flagged</option>
        </select>
        <select id="filter-dept" className="input w-auto text-sm" value={filter.department} onChange={e => setFilter(f => ({ ...f, department: e.target.value }))}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Officer Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      ) : officers.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-3xl mb-2">👷</p>
          <p className="text-slate-500">No officers found. Add your first officer above.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {officers.map(o => (
            <OfficerCard
              key={o._id}
              officer={o}
              onSuspend={async (id) => {
                await fetch(`/api/officers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isSuspended: true }) });
                fetchOfficers();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
