import mongoose, { Schema, Document } from 'mongoose';

export type ComplaintStatus =
  | 'submitted'
  | 'acknowledged'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'disputed'
  | 'closed'
  | 'escalated_to_cm';

export type ComplaintCategory =
  | 'pothole'
  | 'waterlogging'
  | 'garbage'
  | 'streetlight'
  | 'sewer'
  | 'encroachment'
  | 'noise'
  | 'critical_gas_leak'
  | 'critical_electrocution'
  | 'critical_structural'
  | 'critical_fire'
  | 'other';

export const CRITICAL_CATEGORIES: string[] = [
  'critical_gas_leak',
  'critical_electrocution',
  'critical_structural',
  'critical_fire',
];

export const SLA_DAYS: Record<string, number> = {
  pothole: 7,
  waterlogging: 3,
  garbage: 2,
  streetlight: 5,
  sewer: 3,
  encroachment: 10,
  noise: 2,
  critical_gas_leak: 0.17,     // 4 hours
  critical_electrocution: 0.17,
  critical_structural: 0.25,   // 6 hours
  critical_fire: 0.08,         // 2 hours
  other: 7,
};

export interface IStatusUpdate {
  status: ComplaintStatus;
  note: string;
  updatedBy: mongoose.Types.ObjectId | null;
  timestamp: Date;
  proofPhotoUrl?: string;
  proofPhotoGeoLat?: number;
  proofPhotoGeoLng?: number;
}

export interface IComplaint extends Document {
  ticketId: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  isCritical: boolean;
  status: ComplaintStatus;
  location: {
    address: string;
    lat: number;
    lng: number;
    ward?: string;
    district?: string;
  };
  submittedBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  department?: string;
  statusHistory: IStatusUpdate[];
  citizenRating?: number;
  citizenFeedback?: string;
  isDisputed: boolean;
  disputeReason?: string;
  disputedAt?: Date;
  disputeResolvedAt?: Date;
  disputeResolvedBy?: mongoose.Types.ObjectId;
  isFalseClosure: boolean;
  proofPhotoUrl?: string;
  proofPhotoHash?: string;
  proofPhotoGeoLat?: number;
  proofPhotoGeoLng?: number;
  cpgramsRef?: string;
  cpgramsSynced: boolean;
  slaDeadline: Date;
  slaBreached: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StatusUpdateSchema = new Schema<IStatusUpdate>(
  {
    status: { type: String, required: true },
    note: { type: String, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    timestamp: { type: Date, default: Date.now },
    proofPhotoUrl: String,
    proofPhotoGeoLat: Number,
    proofPhotoGeoLng: Number,
  },
  { _id: false }
);

const ComplaintSchema = new Schema<IComplaint>(
  {
    ticketId: { type: String, unique: true },
    title: { type: String, required: true, maxlength: 200, trim: true },
    description: { type: String, required: true, maxlength: 2000, trim: true },
    category: { type: String, required: true },
    isCritical: { type: Boolean, default: false },
    status: { type: String, default: 'submitted' },
    location: {
      address: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      ward: String,
      district: String,
    },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'Officer' },
    department: String,
    statusHistory: [StatusUpdateSchema],
    citizenRating: { type: Number, min: 1, max: 5 },
    citizenFeedback: String,
    isDisputed: { type: Boolean, default: false },
    disputeReason: String,
    disputedAt: Date,
    disputeResolvedAt: Date,
    disputeResolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isFalseClosure: { type: Boolean, default: false },
    proofPhotoUrl: String,
    proofPhotoHash: String,
    proofPhotoGeoLat: Number,
    proofPhotoGeoLng: Number,
    cpgramsRef: String,
    cpgramsSynced: { type: Boolean, default: false },
    slaDeadline: Date,
    slaBreached: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-generate ticket ID and compute SLA before first save
ComplaintSchema.pre('save', async function () {
  if (this.isNew) {
    const count = await mongoose.model('Complaint').countDocuments();
    this.ticketId = `DLH-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    const slaDays = SLA_DAYS[this.category] ?? 7;
    this.slaDeadline = new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000);
    this.isCritical = CRITICAL_CATEGORIES.includes(this.category);
    // Push initial status to history
    this.statusHistory.push({
      status: 'submitted',
      note: 'Complaint submitted by citizen.',
      updatedBy: this.submittedBy as mongoose.Types.ObjectId,
      timestamp: new Date(),
    });
  }
});


// Compound indexes for common queries
ComplaintSchema.index({ 'location.lat': 1, 'location.lng': 1 });
ComplaintSchema.index({ status: 1, createdAt: -1 });
ComplaintSchema.index({ isCritical: 1, status: 1 });
ComplaintSchema.index({ slaDeadline: 1, slaBreached: 1 });
ComplaintSchema.index({ submittedBy: 1, createdAt: -1 });
ComplaintSchema.index({ assignedTo: 1, status: 1 });

const Complaint =
  mongoose.models.Complaint || mongoose.model<IComplaint>('Complaint', ComplaintSchema);
export default Complaint;
