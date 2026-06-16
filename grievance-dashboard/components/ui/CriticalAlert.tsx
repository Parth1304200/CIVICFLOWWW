'use client';

interface Props {
  ticketId: string;
  category: string;
  location: string;
  reportedBy?: string;
  onDismiss?: () => void;
}

export default function CriticalAlert({ ticketId, category, location, reportedBy, onDismiss }: Props) {
  const label = category.replace('critical_', '').replace(/_/g, ' ').toUpperCase();

  return (
    <div className="relative flex items-start gap-4 p-4 rounded-2xl bg-red-900 border-2 border-red-500 text-white critical-pulse">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-xl">
        🚨
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold uppercase tracking-widest text-red-300">Critical Alert</span>
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        </div>
        <p className="font-bold text-base">{label}</p>
        <p className="text-sm text-red-200 mt-0.5 truncate">{location}</p>
        {reportedBy && (
          <p className="text-xs text-red-300 mt-0.5">Reported by: {reportedBy}</p>
        )}
        <p className="text-xs text-red-300 mt-1 font-mono">{ticketId}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-red-300 hover:text-white transition-colors text-lg"
          aria-label="Dismiss alert"
        >
          ✕
        </button>
      )}
    </div>
  );
}
