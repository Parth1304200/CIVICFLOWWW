'use client';

const STATUS_BADGE: Record<string, { label: string; class: string }> = {
  submitted: { label: 'Submitted', class: 'badge-yellow' },
  acknowledged: { label: 'Acknowledged', class: 'badge-blue' },
  assigned: { label: 'Assigned', class: 'badge-blue' },
  in_progress: { label: 'In Progress', class: 'badge-purple' },
  resolved: { label: 'Resolved', class: 'badge-green' },
  disputed: { label: 'Disputed', class: 'badge-orange' },
  closed: { label: 'Closed', class: 'badge-gray' },
  escalated_to_cm: { label: 'Escalated → CM', class: 'badge-red' },
};

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

interface Props {
  complaints: Complaint[];
  onAssign?: (id: string) => void;
  onUpdateStatus?: (id: string, status: string) => void;
  showActions?: boolean;
}

export default function ComplaintTable({ complaints, onAssign, onUpdateStatus, showActions }: Props) {
  if (!complaints.length) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">
        <p className="text-3xl mb-2">📭</p>
        No complaints found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="table-base">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Issue</th>
            <th>Category</th>
            <th>Status</th>
            <th>Location</th>
            <th>SLA</th>
            <th>Officer</th>
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {complaints.map(c => {
            const sla = new Date(c.slaDeadline);
            const now = new Date();
            const hoursLeft = Math.round((sla.getTime() - now.getTime()) / (1000 * 60 * 60));
            const badge = STATUS_BADGE[c.status] ?? { label: c.status, class: 'badge-gray' };

            return (
              <tr key={c._id}>
                <td>
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-semibold text-slate-700">{c.ticketId}</span>
                    {c.isCritical && (
                      <span className="badge-red mt-0.5 text-[10px]">🚨 Critical</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="max-w-[200px]">
                    <p className="text-sm font-medium text-slate-900 truncate">{c.title}</p>
                    {c.submittedBy && (
                      <p className="text-xs text-slate-400 mt-0.5">by {c.submittedBy.name}</p>
                    )}
                  </div>
                </td>
                <td>
                  <span className="text-xs text-slate-600 capitalize">
                    {c.category.replace(/_/g, ' ')}
                  </span>
                </td>
                <td>
                  <span className={badge.class}>{badge.label}</span>
                </td>
                <td>
                  <p className="text-xs text-slate-600 max-w-[150px] truncate">{c.location.address}</p>
                  {c.location.district && (
                    <p className="text-xs text-slate-400">{c.location.district}</p>
                  )}
                </td>
                <td>
                  {c.slaBreached ? (
                    <span className="badge-red">⚠️ Breached</span>
                  ) : (
                    <span className={`text-xs font-medium ${hoursLeft <= 24 ? 'text-amber-600' : 'text-green-600'}`}>
                      {hoursLeft > 0 ? `${hoursLeft}h left` : 'Today'}
                    </span>
                  )}
                </td>
                <td>
                  {c.assignedTo ? (
                    <div>
                      <p className="text-xs font-medium text-slate-700">{c.assignedTo.name}</p>
                      <p className="text-xs text-slate-400">{c.assignedTo.department}</p>
                    </div>
                  ) : (
                    showActions && onAssign ? (
                      <button
                        id={`assign-${c._id}`}
                        onClick={() => onAssign(c._id)}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        Assign →
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Unassigned</span>
                    )
                  )}
                </td>
                {showActions && onUpdateStatus && (
                  <td>
                    <select
                      id={`status-select-${c._id}`}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      value={c.status}
                      onChange={e => onUpdateStatus(c._id, e.target.value)}
                    >
                      <option value="submitted">Submitted</option>
                      <option value="acknowledged">Acknowledged</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
