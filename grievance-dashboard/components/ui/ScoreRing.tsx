'use client';

interface Props {
  score: number;
  tier: 'excellent' | 'good' | 'at_risk' | 'flagged';
  size?: number;
}

const TIER_COLORS: Record<string, string> = {
  excellent: '#10b981',
  good: '#3b82f6',
  at_risk: '#f59e0b',
  flagged: '#ef4444',
};

const TIER_LABELS: Record<string, string> = {
  excellent: 'Excellent',
  good: 'Good',
  at_risk: 'At Risk',
  flagged: 'Flagged',
};

export default function ScoreRing({ score, tier, size = 72 }: Props) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = TIER_COLORS[tier] ?? '#64748b';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={6}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-sm font-bold tabular-nums"
            style={{ color }}
          >
            {score}
          </span>
        </div>
      </div>
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ color, backgroundColor: color + '18' }}
      >
        {TIER_LABELS[tier]}
      </span>
    </div>
  );
}
