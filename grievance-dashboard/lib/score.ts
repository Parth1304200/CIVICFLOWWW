import mongoose from 'mongoose';
import { connectDB } from './mongodb';

const WEIGHTS = {
  speedMax: 30,
  satisfactionMax: 25,
  falseClosureMax: 30,
  repeatMax: 15,
};

export async function recomputeOfficerScore(officerId: string) {
  await connectDB();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const Complaint = mongoose.model('Complaint');
  const Officer = mongoose.model('Officer');

  const [complaints, falseClosures, repeats] = await Promise.all([
    Complaint.find({
      assignedTo: officerId,
      status: { $in: ['resolved', 'closed'] },
      updatedAt: { $gte: thirtyDaysAgo },
    }),
    Complaint.countDocuments({
      assignedTo: officerId,
      isFalseClosure: true,
      updatedAt: { $gte: thirtyDaysAgo },
    }),
    Complaint.countDocuments({
      assignedTo: officerId,
      status: 'submitted',
      createdAt: { $gte: thirtyDaysAgo },
    }),
  ]);

  // Speed component (30 pts) — % of complaints resolved on time
  let speedScore = WEIGHTS.speedMax;
  if (complaints.length > 0) {
    const onTime = complaints.filter((c: any) => !c.slaBreached).length;
    speedScore = Math.round((onTime / complaints.length) * WEIGHTS.speedMax);
  }

  // Satisfaction component (25 pts) — avg citizen rating
  const rated = complaints.filter((c: any) => c.citizenRating);
  let satScore = Math.round(WEIGHTS.satisfactionMax * 0.7); // default 70% if no ratings
  if (rated.length > 0) {
    const avg = rated.reduce((sum: number, c: any) => sum + (c.citizenRating ?? 0), 0) / rated.length;
    satScore = Math.round(((avg - 1) / 4) * WEIGHTS.satisfactionMax);
  }

  // False closure component (30 pts) — each false closure -10
  const falsePenalty = Math.min(WEIGHTS.falseClosureMax, falseClosures * 10);
  const falseScore = Math.max(0, WEIGHTS.falseClosureMax - falsePenalty);

  // Repeat complaint component (15 pts)
  const repeatScore = Math.max(0, WEIGHTS.repeatMax - Math.round(repeats * 1.5));

  const total = Math.min(100, speedScore + satScore + falseScore + repeatScore);

  const tier =
    total >= 80 ? 'excellent' :
    total >= 60 ? 'good' :
    total >= 40 ? 'at_risk' : 'flagged';

  const isSuspended = total < 40;

  await Officer.findByIdAndUpdate(officerId, {
    accountabilityScore: total,
    tier,
    isSuspended,
    ...(isSuspended
      ? { suspendedAt: new Date(), suspendedReason: 'Auto-suspended: accountability score below 40' }
      : {}),
  });

  return { total, tier, isSuspended, speedScore, satScore, falseScore, repeatScore };
}

export async function recordScoreEvent(
  officerId: string,
  complaintId: string,
  eventType: string,
  delta: number,
  note: string,
  createdBy?: string
) {
  await connectDB();
  const ScoreEvent = mongoose.model('ScoreEvent');
  await ScoreEvent.create({ officerId, complaintId, eventType, delta, note, createdBy });
  return recomputeOfficerScore(officerId);
}
