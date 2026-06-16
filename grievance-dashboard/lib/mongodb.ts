import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

console.log('--- MongoDB Connection Debug ---');
console.log(`[DB] MONGODB_URI exists: ${!!MONGODB_URI}`);

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

try {
  const url = new URL(MONGODB_URI);
  console.log(`[DB] Hostname being used: ${url.hostname}`);
} catch (e) {
  console.log('[DB] Could not parse hostname from MONGODB_URI');
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: typeof mongoose | null;
}

let cached = global._mongooseConn;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached) {
    console.log('[DB] Using cached MongoDB connection');
    return cached;
  }

  const opts = {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  try {
    console.log('[DB] Attempting new MongoDB connection...');
    cached = await mongoose.connect(MONGODB_URI, opts);
    global._mongooseConn = cached;
    console.log('[DB] ✅ MongoDB connection succeeded');
    return cached;
  } catch (error) {
    console.error('[DB] ❌ MongoDB connection failed:', error);
    throw error;
  }
}
