const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Pre-load models
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const Message = require('../models/Message');

const usersData = [
  {
    name: 'Admin User',
    email: 'admin@civicflow.com',
    password: 'adminPassword123',
    role: 'admin',
    isActive: true,
    isProfileSetup: true,
    nagrikId: 'DL-NG-000001'
  },
  {
    name: 'Manager User',
    email: 'manager@civicflow.com',
    password: 'managerPassword123',
    role: 'manager',
    isActive: true,
    isProfileSetup: true,
    nagrikId: 'DL-NG-000002'
  },
  {
    name: 'Sales User',
    email: 'sales@civicflow.com',
    password: 'salesPassword123',
    role: 'sales',
    isActive: true,
    isProfileSetup: true,
    nagrikId: 'DL-NG-000003'
  },
  {
    name: 'Citizen User',
    email: 'citizen@civicflow.com',
    password: 'citizenPassword123',
    role: 'citizen',
    isActive: true,
    isProfileSetup: true,
    nagrikId: 'DL-NG-000004'
  },
  {
    name: 'CM User',
    email: 'cm@civicflow.com',
    password: 'cmPassword123',
    role: 'cm',
    isActive: true,
    isProfileSetup: true,
    nagrikId: 'DL-NG-000005'
  }
];

const complaintsData = (userId) => [
  {
    title: 'Huge Pothole on Main Road',
    category: 'Roads & Infrastructure',
    description: 'There is a very deep pothole causing traffic issues near the traffic signal.',
    location: { lat: 28.6139, lng: 77.2090 },
    landmark: 'Near Metro Station Gate 1',
    occurrenceDate: new Date(),
    urgency: 'High',
    impactScale: 'Whole street/community',
    contactPreference: 'Email',
    status: 'initiated',
    user: userId
  },
  {
    title: 'Broken Streetlight',
    category: 'Utilities',
    description: 'Streetlight has been flickering and is mostly dark at night, causing safety concerns.',
    location: { lat: 28.6150, lng: 77.2100 },
    landmark: 'Opposite Sector 4 Park',
    occurrenceDate: new Date(),
    urgency: 'Medium',
    impactScale: 'Few neighbors',
    contactPreference: 'SMS',
    status: 'Pending',
    user: userId
  }
];

const customersData = (salesId) => [
  {
    name: 'John Doe',
    email: 'john@company.com',
    phone: '+919876543210',
    company: 'TechCorp Solutions',
    status: 'active',
    assignedTo: salesId,
    notes: 'Key client for tech infrastructure'
  },
  {
    name: 'Jane Smith',
    email: 'jane@enterprise.com',
    phone: '+918765432109',
    company: 'Smith Enterprise',
    status: 'lead',
    assignedTo: salesId,
    notes: 'Interested in civic management software integration'
  }
];

const leadsData = (customerId, salesId) => [
  {
    title: 'Software Integration Deal',
    customer: customerId,
    assignedTo: salesId,
    value: 50000,
    stage: 'qualified',
    probability: 60,
    expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    notes: 'Needs proposal deck by end of week'
  }
];

const seedMongo = async (uri) => {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log('Clearing existing database collections...');
  await User.deleteMany({});
  await Complaint.deleteMany({});
  await Customer.deleteMany({});
  await Lead.deleteMany({});
  await Message.deleteMany({});

  console.log('Seeding Users...');
  const seededUsers = [];
  for (const u of usersData) {
    const user = await User.create(u);
    seededUsers.push(user);
  }

  const citizen = seededUsers.find(u => u.role === 'citizen');
  const sales = seededUsers.find(u => u.role === 'sales');

  console.log('Seeding Complaints...');
  for (const c of complaintsData(citizen._id)) {
    await Complaint.create(c);
  }

  console.log('Seeding Customers...');
  const seededCustomers = [];
  for (const cust of customersData(sales._id)) {
    const customer = await Customer.create(cust);
    seededCustomers.push(customer);
  }

  console.log('Seeding Leads...');
  for (const l of leadsData(seededCustomers[0]._id, sales._id)) {
    await Lead.create(l);
  }

  console.log('✅ MongoDB Seeding completed successfully!');
  await mongoose.connection.close();
};

const seedLocalFiles = async () => {
  console.log('Running in Local File Mode. Creating JSON database files...');
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Helper to hash passwords for local storage
  const hashedUsers = await Promise.all(
    usersData.map(async (u) => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(u.password, salt);
      const userObj = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...u,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return userObj;
    })
  );

  const citizen = hashedUsers.find(u => u.role === 'citizen');
  const sales = hashedUsers.find(u => u.role === 'sales');

  const formattedComplaints = complaintsData(citizen._id).map((c) => ({
    _id: new mongoose.Types.ObjectId().toString(),
    ...c,
    occurrenceDate: c.occurrenceDate.toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  const formattedCustomers = customersData(sales._id).map((cust) => ({
    _id: new mongoose.Types.ObjectId().toString(),
    ...cust,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  const formattedLeads = leadsData(formattedCustomers[0]._id, sales._id).map((l) => ({
    _id: new mongoose.Types.ObjectId().toString(),
    ...l,
    expectedCloseDate: l.expectedCloseDate.toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  fs.writeFileSync(path.join(dataDir, 'users.json'), JSON.stringify(hashedUsers, null, 2));
  fs.writeFileSync(path.join(dataDir, 'complaints.json'), JSON.stringify(formattedComplaints, null, 2));
  fs.writeFileSync(path.join(dataDir, 'customers.json'), JSON.stringify(formattedCustomers, null, 2));
  fs.writeFileSync(path.join(dataDir, 'leads.json'), JSON.stringify(formattedLeads, null, 2));
  fs.writeFileSync(path.join(dataDir, 'messages.json'), JSON.stringify([], null, 2));

  console.log('✅ Local File Database Seeding completed successfully!');
};

const run = async () => {
  const uri = process.env.MONGO_URI;
  try {
    if (uri) {
      await seedMongo(uri);
    } else {
      await seedLocalFiles();
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

run();
