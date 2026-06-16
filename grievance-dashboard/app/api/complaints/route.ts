import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Complaint from '@/models/Complaint';
import { syncToCPGRAMS } from '@/lib/cpgrams';

// GET /api/complaints — list with filters
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  const query: Record<string, unknown> = {};

  // Citizens can only see their own complaints
  if (role === 'citizen') {
    query.submittedBy = userId;
  }

  // Optional filters
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const isCritical = searchParams.get('isCritical');
  const department = searchParams.get('department');

  if (status) query.status = status;
  if (category) query.category = category;
  if (isCritical === 'true') query.isCritical = true;
  if (department) query.department = department;

  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
  const skip = (page - 1) * limit;

  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .populate('submittedBy', 'name email phone')
      .populate('assignedTo', 'name department phone accountabilityScore')
      .sort({ isCritical: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Complaint.countDocuments(query),
  ]);

  return NextResponse.json({
    complaints,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

// POST /api/complaints — create new
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { title, description, category, location } = body;

  if (!title || !description || !category || !location) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (title.length > 200 || description.length > 2000) {
    return NextResponse.json({ error: 'Content too long' }, { status: 400 });
  }

  await connectDB();

  const complaint = await Complaint.create({
    title: title.trim(),
    description: description.trim(),
    category,
    location,
    submittedBy: (session.user as any).id,
    statusHistory: [],
  });

  // Sync to CPGRAMS asynchronously (non-blocking)
  syncToCPGRAMS({
    title: complaint.title,
    description: complaint.description,
    category: complaint.category,
    address: complaint.location.address,
    state: 'Delhi',
    district: complaint.location.district ?? 'Delhi',
    pincode: '',
    citizenName: (session.user as any).name ?? '',
    citizenPhone: '',
    citizenEmail: (session.user as any).email ?? '',
  }).then(async ({ ref, synced }) => {
    await Complaint.findByIdAndUpdate(complaint._id, { cpgramsRef: ref, cpgramsSynced: synced });
  }).catch(console.error);

  // Trigger critical alert
  if (complaint.isCritical) {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/alerts/critical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaintId: complaint._id.toString() }),
    }).catch(console.error);
  }

  return NextResponse.json({ complaint }, { status: 201 });
}
