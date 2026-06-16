import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recomputeOfficerScore } from '@/lib/score';
import { connectDB } from '@/lib/mongodb';
import Officer from '@/models/Officer';

// GET /api/officers/[id]/score — get officer score breakdown
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !['admin', 'cm'].includes((session.user as any).role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const result = await recomputeOfficerScore(params.id);
  const officer = await Officer.findById(params.id).lean();

  return NextResponse.json({ ...result, officer });
}

// POST /api/officers/[id]/score — CM override score event
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'cm') {
    return NextResponse.json({ error: 'Forbidden — CM only' }, { status: 403 });
  }

  const { complaintId, delta, note } = await req.json();
  if (!complaintId || delta === undefined || !note) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  await connectDB();
  const { recordScoreEvent } = await import('@/lib/score');
  const result = await recordScoreEvent(
    params.id,
    complaintId,
    'cm_override',
    delta,
    note,
    (session.user as any).id
  );

  return NextResponse.json(result);
}
