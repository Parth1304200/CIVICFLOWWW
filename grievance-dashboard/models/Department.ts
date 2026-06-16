import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  code: string;
  headName: string;
  headEmail: string;
  headPhone: string;
  categories: string[];
  totalComplaints: number;
  resolvedComplaints: number;
  avgResolutionDays: number;
  isActive: boolean;
  createdAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    headName: String,
    headEmail: String,
    headPhone: String,
    categories: [{ type: String }],
    totalComplaints: { type: Number, default: 0 },
    resolvedComplaints: { type: Number, default: 0 },
    avgResolutionDays: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Department =
  mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);
export default Department;
