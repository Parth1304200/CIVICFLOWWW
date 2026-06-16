import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User';
import Officer from '../models/Officer';
import Department from '../models/Department';
import Complaint from '../models/Complaint';

dotenv.config({ path: '.env.local' });

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set in .env.local');
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');
}

async function seed() {
  await connectDB();

  await connectDB();

  // ─── CM Account ────────────────────────────────────────────
  const cmEmail = process.env.SEED_CM_EMAIL ?? 'rekha@gupta.com';
  const cmPassword = process.env.SEED_CM_PASSWORD ?? 'Rekha@1234#';
  const cmHash = await bcrypt.hash(cmPassword, 12);

  const cmUser = await User.findOneAndUpdate(
    { email: cmEmail },
    { name: 'Rekha Gupta', email: cmEmail, passwordHash: cmHash, role: 'cm', isVerified: true },
    { upsert: true, new: true }
  );
  console.log(`✅ CM account: ${cmEmail}`);

  // ─── Admin Account ─────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@Delhi2026#', 12);
  await User.findOneAndUpdate(
    { email: 'admin@delhicmo.gov.in' },
    {
      name: 'CMO Admin',
      email: 'admin@delhicmo.gov.in',
      passwordHash: adminHash,
      role: 'admin',
      isVerified: true,
    },
    { upsert: true }
  );
  console.log('✅ Admin account: admin@delhicmo.gov.in / Admin@Delhi2026#');

  // ─── Departments ───────────────────────────────────────────
  const deptData = [
    { name: 'PWD', code: 'PWD', categories: ['pothole', 'streetlight', 'encroachment'] },
    { name: 'MCD', code: 'MCD', categories: ['garbage', 'encroachment', 'noise'] },
    { name: 'BSES', code: 'BSES', categories: ['streetlight', 'critical_electrocution'] },
    { name: 'Delhi Jal Board', code: 'DJB', categories: ['waterlogging', 'sewer'] },
    { name: 'Delhi Police', code: 'DPL', categories: ['encroachment', 'noise'] },
    { name: 'Fire Services', code: 'DFS', categories: ['critical_gas_leak', 'critical_fire', 'critical_structural'] },
  ];

  for (const d of deptData) {
    await Department.findOneAndUpdate(
      { code: d.code },
      { ...d, isActive: true },
      { upsert: true }
    );
  }
  console.log(`✅ ${deptData.length} departments seeded`);

  // ─── Sample Officers ──────────────────────────────────────
  const officerData = [
    { name: 'Ramesh Sharma', employeeId: 'PWD-001', dept: 'PWD', ward: 'Connaught Place', score: 87 },
    { name: 'Priya Mehta', employeeId: 'MCD-001', dept: 'MCD', ward: 'Karol Bagh', score: 72 },
    { name: 'Suresh Yadav', employeeId: 'DJB-001', dept: 'Delhi Jal Board', ward: 'Rohini', score: 55 },
    { name: 'Anita Singh', employeeId: 'BSES-001', dept: 'BSES', ward: 'Dwarka', score: 91 },
    { name: 'Vikram Gupta', employeeId: 'DFS-001', dept: 'Fire Services', ward: 'Central Delhi', score: 38 },
  ];

  for (const o of officerData) {
    const email = `${o.employeeId.toLowerCase()}@delhicmo.gov.in`;
    const hash = await bcrypt.hash('Officer@1234#', 12);

    const user = await User.findOneAndUpdate(
      { email },
      { name: o.name, email, passwordHash: hash, role: 'officer', isVerified: true, phone: '+91-98' + Math.floor(10000000 + Math.random() * 89999999) },
      { upsert: true, new: true }
    );

    const tier =
      o.score >= 80 ? 'excellent' :
      o.score >= 60 ? 'good' :
      o.score >= 40 ? 'at_risk' : 'flagged';

    await Officer.findOneAndUpdate(
      { employeeId: o.employeeId },
      {
        userId: user._id,
        name: o.name,
        employeeId: o.employeeId,
        department: o.dept,
        ward: o.ward,
        phone: user.phone,
        accountabilityScore: o.score,
        tier,
        isSuspended: o.score < 40,
        maxCapacity: 10,
        activeComplaintsCount: Math.floor(Math.random() * 7),
      },
      { upsert: true }
    );
  }
  console.log(`✅ ${officerData.length} officers seeded`);

  // ─── Sample Complaints ─────────────────────────────────────
  const sampleLocations = [
    { address: 'Ring Road near ITO, New Delhi', lat: 28.6271, lng: 77.2426, ward: 'ITO', district: 'Central Delhi' },
    { address: 'Connaught Place, Rajiv Chowk, New Delhi', lat: 28.6315, lng: 77.2167, ward: 'CP', district: 'New Delhi' },
    { address: 'Karol Bagh Main Bazaar, New Delhi', lat: 28.6519, lng: 77.1909, ward: 'Karol Bagh', district: 'Central West Delhi' },
    { address: 'Rohini Sector 3, New Delhi', lat: 28.7361, lng: 77.1163, ward: 'Rohini', district: 'North West Delhi' },
    { address: 'Dwarka Sector 12, New Delhi', lat: 28.5921, lng: 77.0460, ward: 'Dwarka', district: 'South West Delhi' },
  ];

  const categories = ['pothole', 'waterlogging', 'garbage', 'streetlight', 'sewer', 'critical_gas_leak'];
  const statuses = ['submitted', 'acknowledged', 'in_progress', 'resolved'];

  // Only seed if no complaints exist
  const existingCount = await Complaint.countDocuments();
  if (existingCount === 0) {
    const citizenHash = await bcrypt.hash('Citizen@1234#', 12);
    const testCitizen = await User.findOneAndUpdate(
      { email: 'test@citizen.com' },
      { name: 'Test Citizen', email: 'test@citizen.com', passwordHash: citizenHash, role: 'citizen', isVerified: true },
      { upsert: true, new: true }
    );

    for (let i = 0; i < 15; i++) {
      const loc = sampleLocations[i % sampleLocations.length];
      const cat = categories[i % categories.length];
      const stat = statuses[i % statuses.length];

      await Complaint.create({
        title: `Sample complaint #${i + 1}: ${cat.replace(/_/g, ' ')}`,
        description: `This is a sample ${cat.replace(/_/g, ' ')} complaint at ${loc.address}. Citizens have been facing this issue for multiple weeks.`,
        category: cat,
        location: { ...loc },
        submittedBy: testCitizen._id,
        status: stat,
        statusHistory: [],
      });
    }
    console.log('✅ 15 sample complaints seeded');
    console.log('   Test citizen: test@citizen.com / Citizen@1234#');
  } else {
    console.log(`ℹ️  Skipped complaint seeding — ${existingCount} already exist`);
  }

  console.log('\n🎉 Seeding complete!');
  console.log('\nCredentials:');
  console.log(`  CM:      ${cmEmail} / ${cmPassword}`);
  console.log('  Admin:   admin@delhicmo.gov.in / Admin@Delhi2026#');
  console.log('  Officer: pwd-001@delhicmo.gov.in / Officer@1234#');
  console.log('  Citizen: test@citizen.com / Citizen@1234#');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
