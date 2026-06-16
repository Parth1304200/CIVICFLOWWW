import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Complaint from '@/models/Complaint';
import { sendSMSAlert } from '@/lib/mailer';

// POST /api/alerts/critical — called internally after critical complaint submission
export async function POST(req: NextRequest) {
  // Internal route — validate with a shared secret or rely on server-side only calls
  const { complaintId } = await req.json();

  if (!complaintId) {
    return NextResponse.json({ error: 'complaintId required' }, { status: 400 });
  }

  await connectDB();

  const complaint = await Complaint.findById(complaintId).populate('submittedBy', 'name phone');
  if (!complaint || !complaint.isCritical) {
    return NextResponse.json({ sent: false, reason: 'Not a critical complaint' });
  }

  const categoryLabel = complaint.category
    .replace('critical_', '')
    .replace(/_/g, ' ')
    .toUpperCase();

  const message =
    `🚨 CRITICAL ALERT | ${complaint.ticketId}\n` +
    `Type: ${categoryLabel}\n` +
    `Location: ${complaint.location.address}\n` +
    `District: ${complaint.location.district ?? 'Delhi'}\n` +
    `Reported by: ${(complaint.submittedBy as any)?.name ?? 'Citizen'}\n` +
    `Immediate action required.\n` +
    `— Delhi CMO Grievance System`;

  const cmPhone = process.env.CM_PHONE_NUMBER;
  if (cmPhone) {
    await sendSMSAlert(cmPhone, message);
  }

  // Update complaint status to escalated_to_cm
  await Complaint.findByIdAndUpdate(complaintId, {
    status: 'escalated_to_cm',
    $push: {
      statusHistory: {
        status: 'escalated_to_cm',
        note: 'Auto-escalated: critical category detected. CM notified via SMS.',
        updatedBy: null,
        timestamp: new Date(),
      },
    },
  });

  return NextResponse.json({ sent: true, ticketId: complaint.ticketId });
}
