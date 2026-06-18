// Shared helpers for ranking complaints across dashboards.
//
// Priority order (highest first):
//   1. Emergency complaints
//   2. Highest voted complaints
//   3. Everything else, newest first

export const EMERGENCY_CATEGORIES = [
  'Gas Leakage',
  'Building Collapse',
  'Electrocution',
  'Critical Fire',
  'Emergency Other',
];

export function isEmergency(complaint) {
  return EMERGENCY_CATEGORIES.includes(complaint?.category);
}

export function sortByPriority(complaints = []) {
  return [...complaints].sort((a, b) => {
    const aEmergency = isEmergency(a) ? 1 : 0;
    const bEmergency = isEmergency(b) ? 1 : 0;
    if (aEmergency !== bEmergency) return bEmergency - aEmergency;

    const aVotes = a.votes || 0;
    const bVotes = b.votes || 0;
    if (aVotes !== bVotes) return bVotes - aVotes;

    const aDate = new Date(a.createdAt || a.date || 0).getTime();
    const bDate = new Date(b.createdAt || b.date || 0).getTime();
    return bDate - aDate;
  });
}
