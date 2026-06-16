import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Officer from '@/models/Officer';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

// GET /api/officers — list all officers (admin/cm only)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !['admin', 'cm'].includes((session.user as any).role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const { searchParams } = new URL(req.url);

  const query: Record<string, unknown> = {};
  const department = searchParams.get('department');
  const tier = searchParams.get('tier');
  const isSuspended = searchParams.get('isSuspended');

  if (department) query.department = department;
  if (tier) query.tier = tier;
  if (isSuspended !== null) query.isSuspended = isSuspended === 'true';

  const officers = await Officer.find(query)
    .populate('userId', 'name email phone lastLogin')
    .sort({ accountabilityScore: -1 })
    .lean();

  return NextResponse.json({ officers });
}

// POST /api/officers — create officer account (admin only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { name, email, password, employeeId, department, ward, phone, maxCapacity } =
    await req.json();

  if (!name || !email || !password || !employeeId || !department) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: 'officer',
    phone,
    isVerified: true,
  });

  const officer = await Officer.create({
    userId: user._id,
    name,
    employeeId,
    department,
    ward,
    phone,
    maxCapacity: maxCapacity ?? 10,
  });

  return NextResponse.json({ officer }, { status: 201 });
}
