import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Complaint from '@/models/Complaint';
import { haversineDistance } from '@/lib/geocode';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { recordScoreEvent } from '@/lib/score';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/complaints/[id]/proof
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !['officer', 'admin'].includes((session.user as any).role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const complaint = await Complaint.findById(params.id);
  if (!complaint) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get('photo') as File | null;
  const proofLat = parseFloat(formData.get('lat') as string);
  const proofLng = parseFloat(formData.get('lng') as string);

  if (!file) return NextResponse.json({ error: 'Photo is required' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  // Anti-fraud: compute SHA256 to detect photo reuse
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');

  const reused = await Complaint.findOne({
    proofPhotoHash: hash,
    _id: { $ne: complaint._id },
  });
  if (reused) {
    // Flag the officer if reuse detected
    if (complaint.assignedTo) {
      await recordScoreEvent(
        complaint.assignedTo.toString(),
        complaint._id.toString(),
        'false_closure',
        -20,
        `Attempted to reuse proof photo from ticket ${reused.ticketId}`,
        (session.user as any).id
      );
    }
    return NextResponse.json(
      {
        error: 'Photo already used for another complaint. Upload a fresh photo from the site.',
        fraudFlag: true,
        reusedTicket: reused.ticketId,
      },
      { status: 422 }
    );
  }

  // Anti-fraud: GPS proximity check — must be within 500m of complaint location
  if (!isNaN(proofLat) && !isNaN(proofLng)) {
    const dist = haversineDistance(
      complaint.location.lat,
      complaint.location.lng,
      proofLat,
      proofLng
    );
    if (dist > 0.5) {
      return NextResponse.json(
        {
          error: `Proof photo taken ${(dist * 1000).toFixed(0)}m from complaint site. Must be within 500m.`,
          fraudFlag: true,
          distanceMeters: Math.round(dist * 1000),
        },
        { status: 422 }
      );
    }
  }

  // Upload to Cloudinary
  let uploadResult: any;
  try {
    uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'grievance_proofs',
          resource_type: 'image',
          public_id: `proof_${complaint.ticketId}_${Date.now()}`,
        },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });
  } catch (err) {
    console.error('Cloudinary upload failed:', err);
    return NextResponse.json({ error: 'Photo upload failed' }, { status: 500 });
  }

  const photoUrl = uploadResult.secure_url;
  const userId = (session.user as any).id;

  await Complaint.findByIdAndUpdate(params.id, {
    proofPhotoUrl: photoUrl,
    proofPhotoHash: hash,
    proofPhotoGeoLat: proofLat || null,
    proofPhotoGeoLng: proofLng || null,
    status: 'resolved',
    $push: {
      statusHistory: {
        status: 'resolved',
        note: 'Resolution proof photo uploaded by officer.',
        updatedBy: userId,
        timestamp: new Date(),
        proofPhotoUrl: photoUrl,
        proofPhotoGeoLat: proofLat || null,
        proofPhotoGeoLng: proofLng || null,
      },
    },
  });

  return NextResponse.json({ success: true, photoUrl });
}
