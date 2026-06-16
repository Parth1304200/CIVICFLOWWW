import mongoose, { Schema, Document } from 'mongoose';

export interface IScoreEvent extends Document {
  officerId: mongoose.Types.ObjectId;
  complaintId: mongoose.Types.ObjectId;
  eventType:
    | 'resolved_on_time'
    | 'resolved_late'
    | 'false_closure'
    | 'citizen_rating'
    | 'repeat_complaint'
    | 'cm_override';
  delta: number;
  note: string;
  createdAt: Date;
  createdBy?: mongoose.Types.ObjectId;
}

const ScoreEventSchema = new Schema<IScoreEvent>({
  officerId: { type: Schema.Types.ObjectId, ref: 'Officer', required: true },
  complaintId: { type: Schema.Types.ObjectId, ref: 'Complaint', required: true },
  eventType: {
    type: String,
    enum: [
      'resolved_on_time',
      'resolved_late',
      'false_closure',
      'citizen_rating',
      'repeat_complaint',
      'cm_override',
    ],
    required: true,
  },
  delta: { type: Number, required: true },
  note: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
});

ScoreEventSchema.index({ officerId: 1, createdAt: -1 });

const ScoreEvent =
  mongoose.models.ScoreEvent || mongoose.model<IScoreEvent>('ScoreEvent', ScoreEventSchema);
export default ScoreEvent;
