import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Complaint from '@/models/Complaint';
import { recordScoreEvent } from '@/lib/score';

// GET /api/complaints/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const complaint = await Complaint.findById(params.id)
    .populate('submittedBy', 'name email phone')
    .populate('assignedTo', 'name department phone accountabilityScore employeeId')
    .lean();

  if (!complaint) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  // Citizens can only view their own complaints
  if (role === 'citizen' && complaint.submittedBy?.toString() !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ complaint });
}

// PATCH /api/complaints/[id] — status update, rating, assignment
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const body = await req.json();

  await connectDB();
  const complaint = await Complaint.findById(params.id);
  if (!complaint) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { status, note, assignedTo, department, citizenRating, citizenFeedback } = body;

  // Citizen-specific: rating only
  if (role === 'citizen') {
    if (citizenRating !== undefined) {
      if (complaint.submittedBy.toString() !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (!['resolved', 'closed'].includes(complaint.status)) {
        return NextResponse.json({ error: 'Can only rate resolved complaints' }, { status: 400 });
      }
      complaint.citizenRating = citizenRating;
      complaint.citizenFeedback = citizenFeedback;
      await complaint.save();

      // Record rating score event
      if (complaint.assignedTo) {
        await recordScoreEvent(
          complaint.assignedTo.toString(),
          complaint._id.toString(),
          'citizen_rating',
          citizenRating >= 4 ? 5 : citizenRating >= 3 ? 0 : -5,
          `Citizen rated ${citizenRating}/5`,
          userId
        );
      }
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Admin: can assign officers and change status
  if (['admin', 'cm'].includes(role)) {
    if (assignedTo !== undefined) complaint.assignedTo = assignedTo;
    if (department !== undefined) complaint.department = department;
    if (status && status !== complaint.status) {
      complaint.status = status;
      complaint.statusHistory.push({
        status,
        note: note ?? `Status updated by admin.`,
        updatedBy: userId,
        timestamp: new Date(),
      });
    }
    await complaint.save();
    return NextResponse.json({ complaint });
  }

  // Officer: can update status to in_progress or resolved
  if (role === 'officer') {
    const allowedOfficerStatuses = ['in_progress', 'resolved'];
    if (status && allowedOfficerStatuses.includes(status)) {
      complaint.status = status;
      complaint.statusHistory.push({
        status,
        note: note ?? `Status updated by officer.`,
        updatedBy: userId,
        timestamp: new Date(),
      });

      // Check SLA breach
      if (status === 'resolved' && new Date() > complaint.slaDeadline) {
        complaint.slaBreached = true;
        if (complaint.assignedTo) {
          await recordScoreEvent(
            complaint.assignedTo.toString(),
            complaint._id.toString(),
            'resolved_late',
            -10,
            `Resolved after SLA deadline (${complaint.slaDeadline.toDateString()})`,
            userId
          );
        }
      } else if (status === 'resolved' && complaint.assignedTo) {
        await recordScoreEvent(
          complaint.assignedTo.toString(),
          complaint._id.toString(),
          'resolved_on_time',
          10,
          'Resolved within SLA',
          userId
        );
      }

      await complaint.save();
      return NextResponse.json({ complaint });
    }
    return NextResponse.json({ error: 'Forbidden status transition' }, { status: 403 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
