import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Complaint from '@/models/Complaint';

// POST /api/complaints/[id]/dispute
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  if (role !== 'citizen') {
    return NextResponse.json({ error: 'Only citizens can file disputes' }, { status: 403 });
  }

  await connectDB();
  const complaint = await Complaint.findById(params.id);
  if (!complaint) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (complaint.submittedBy.toString() !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (complaint.isDisputed) {
    return NextResponse.json({ error: 'Dispute already filed' }, { status: 400 });
  }

  if (!['resolved', 'closed'].includes(complaint.status)) {
    return NextResponse.json(
      { error: 'Can only dispute resolved or closed complaints' },
      { status: 400 }
    );
  }

  const { reason } = await req.json();
  if (!reason || reason.trim().length < 10) {
    return NextResponse.json({ error: 'Dispute reason must be at least 10 characters' }, { status: 400 });
  }

  complaint.isDisputed = true;
  complaint.disputeReason = reason.trim();
  complaint.disputedAt = new Date();
  complaint.status = 'disputed';
  complaint.statusHistory.push({
    status: 'disputed',
    note: `Citizen filed a dispute: ${reason.trim()}`,
    updatedBy: userId,
    timestamp: new Date(),
  });

  await complaint.save();

  return NextResponse.json({ success: true, ticketId: complaint.ticketId });
}
