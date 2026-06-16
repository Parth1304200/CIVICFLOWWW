import mongoose, { Schema, Document } from 'mongoose';

export interface IOfficer extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  employeeId: string;
  department: string;
  ward: string;
  phone: string;
  activeComplaintsCount: number;
  maxCapacity: number;
  accountabilityScore: number;
  tier: 'excellent' | 'good' | 'at_risk' | 'flagged';
  isSuspended: boolean;
  suspendedAt?: Date;
  suspendedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OfficerSchema = new Schema<IOfficer>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    employeeId: { type: String, unique: true, required: true },
    department: { type: String, required: true },
    ward: String,
    phone: String,
    activeComplaintsCount: { type: Number, default: 0 },
    maxCapacity: { type: Number, default: 10 },
    accountabilityScore: { type: Number, default: 100 },
    tier: {
      type: String,
      enum: ['excellent', 'good', 'at_risk', 'flagged'],
      default: 'good',
    },
    isSuspended: { type: Boolean, default: false },
    suspendedAt: Date,
    suspendedReason: String,
  },
  { timestamps: true }
);

const Officer = mongoose.models.Officer || mongoose.model<IOfficer>('Officer', OfficerSchema);
export default Officer;
