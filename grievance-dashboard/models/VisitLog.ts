import mongoose, { Schema, Document } from 'mongoose';

export interface IVisitLog extends Document {
  officerId: mongoose.Types.ObjectId;
  complaintId: mongoose.Types.ObjectId;
  visitedAt: Date;
  lat: number;
  lng: number;
  note?: string;
  photoUrl?: string;
}

const VisitLogSchema = new Schema<IVisitLog>(
  {
    officerId: { type: Schema.Types.ObjectId, ref: 'Officer', required: true },
    complaintId: { type: Schema.Types.ObjectId, ref: 'Complaint', required: true },
    visitedAt: { type: Date, default: Date.now },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    note: String,
    photoUrl: String,
  },
  { timestamps: true }
);

VisitLogSchema.index({ complaintId: 1, visitedAt: -1 });
VisitLogSchema.index({ officerId: 1, visitedAt: -1 });

const VisitLog =
  mongoose.models.VisitLog || mongoose.model<IVisitLog>('VisitLog', VisitLogSchema);
export default VisitLog;
