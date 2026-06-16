'use client';

import ScoreRing from '@/components/ui/ScoreRing';

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

interface Props {
  officer: Officer;
  onSuspend?: (id: string) => void;
}

export default function OfficerCard({ officer, onSuspend }: Props) {
  const capacity = Math.round((officer.activeComplaintsCount / officer.maxCapacity) * 100);

  return (
    <div className={`card p-5 ${officer.isSuspended ? 'border-red-200 bg-red-50/30' : ''}`}>
      {officer.isSuspended && (
        <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-red-600">
          <span className="pulse-dot bg-red-500" />
          AUTO-SUSPENDED — Score below 40
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Score ring */}
        <ScoreRing score={officer.accountabilityScore} tier={officer.tier} size={64} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 truncate">{officer.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{officer.employeeId} · {officer.department}</p>
          {officer.ward && (
            <p className="text-xs text-slate-400 mt-0.5">Ward: {officer.ward}</p>
          )}
          {officer.phone && (
            <a href={`tel:${officer.phone}`} className="text-xs text-blue-600 hover:underline">
              {officer.phone}
            </a>
          )}
        </div>
      </div>

      {/* Capacity bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span>Case Load</span>
          <span className={`font-medium ${capacity >= 90 ? 'text-red-600' : capacity >= 70 ? 'text-amber-600' : 'text-green-600'}`}>
            {officer.activeComplaintsCount}/{officer.maxCapacity} cases
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              capacity >= 90 ? 'bg-red-500' :
              capacity >= 70 ? 'bg-amber-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(capacity, 100)}%` }}
          />
        </div>
      </div>

      {/* Last login */}
      {officer.userId?.lastLogin && (
        <p className="text-xs text-slate-400 mt-3">
          Last active: {new Date(officer.userId.lastLogin).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
        </p>
      )}

      {/* Action */}
      {!officer.isSuspended && onSuspend && officer.accountabilityScore < 60 && (
        <button
          id={`suspend-${officer._id}`}
          onClick={() => onSuspend(officer._id)}
          className="btn-danger text-xs mt-3 w-full py-2"
        >
          Manually Suspend
        </button>
      )}
    </div>
  );
}
