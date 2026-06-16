'use client';

const STAGES = [
  { key: 'submitted', label: 'Submitted', icon: '📋' },
  { key: 'acknowledged', label: 'Acknowledged', icon: '✅' },
  { key: 'assigned', label: 'Assigned', icon: '👷' },
  { key: 'in_progress', label: 'In Progress', icon: '🔧' },
  { key: 'resolved', label: 'Resolved', icon: '✔️' },
  { key: 'closed', label: 'Closed', icon: '🏁' },
];

interface StatusUpdate {
  status: string;
  note: string;
  timestamp: string;
}

interface Props {
  currentStatus: string;
  history: StatusUpdate[];
  isDisputed: boolean;
  proofPhotoUrl?: string;
}

export default function StatusTimeline({ currentStatus, history, isDisputed, proofPhotoUrl }: Props) {
  const currentIndex = STAGES.findIndex(s => s.key === currentStatus);
  const effectiveIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div>
      {STAGES.map((stage, idx) => {
        const isDone = idx <= effectiveIndex;
        const isCurrent = idx === effectiveIndex;
        const historyEntry = [...history].reverse().find(h => h.status === stage.key);

        return (
          <div key={stage.key} className="flex gap-4">
            {/* Dot + line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-base border-2 transition-all ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-50 scale-110 shadow-sm shadow-blue-200'
                    : isDone
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {stage.icon}
              </div>
              {idx < STAGES.length - 1 && (
                <div
                  className={`w-0.5 h-10 mt-1 rounded-full ${
                    isDone && idx < effectiveIndex ? 'bg-green-400' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className="pb-10 flex-1">
              <div className="flex items-center gap-2">
                <p
                  className={`text-sm font-semibold ${
                    isDone ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {stage.label}
                </p>
                {isCurrent && !['resolved', 'closed'].includes(currentStatus) && (
                  <span className="pulse-dot bg-blue-500" />
                )}
              </div>

              {historyEntry && (
                <>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{historyEntry.note}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(historyEntry.timestamp).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </>
              )}

              {/* Proof photo at resolution step */}
              {stage.key === 'resolved' && isDone && proofPhotoUrl && (
                <div className="mt-2">
                  <p className="text-xs text-green-700 font-semibold mb-1.5">📷 Proof of Resolution:</p>
                  <img
                    src={proofPhotoUrl}
                    alt="Resolution proof"
                    className="rounded-xl border-2 border-green-200 w-full max-w-xs object-cover shadow-sm"
                    style={{ maxHeight: 200 }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Dispute Banner */}
      {isDisputed && (
        <div className="mt-2 p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <div className="flex items-start gap-2">
            <span className="text-orange-600">⚖️</span>
            <div>
              <p className="text-sm font-semibold text-orange-800">Dispute Filed</p>
              <p className="text-xs text-orange-600 mt-0.5">
                Your dispute is under review. A supervisor will re-investigate within 48 hours.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
