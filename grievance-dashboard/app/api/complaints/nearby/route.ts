import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Complaint from '@/models/Complaint';
import { buildGeoQuery, haversineDistance } from '@/lib/geocode';

// GET /api/complaints/nearby?lat=&lng=&radius=2
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'cm') {
    return NextResponse.json({ error: 'Forbidden — CM access only' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lng = parseFloat(searchParams.get('lng') ?? '');
  const radius = Math.min(parseFloat(searchParams.get('radius') ?? '2'), 10); // cap at 10km

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  await connectDB();

  const geoFilter = buildGeoQuery(lat, lng, radius);
  const complaints = await Complaint.find(geoFilter)
    .populate('assignedTo', 'name department phone accountabilityScore tier')
    .populate('submittedBy', 'name phone')
    .sort({ isCritical: -1, createdAt: -1 })
    .limit(200)
    .lean();

  // Precise haversine filter + add distance field
  const filtered = complaints
    .map((c) => ({
      ...c,
      distanceKm: haversineDistance(lat, lng, c.location.lat, c.location.lng),
    }))
    .filter((c) => c.distanceKm <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return NextResponse.json({
    complaints: filtered,
    count: filtered.length,
    centerLat: lat,
    centerLng: lng,
    radiusKm: radius,
  });
}
