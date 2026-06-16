import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'citizen' | 'officer' | 'admin' | 'cm';
  phone?: string;
  isVerified: boolean;
  createdAt: Date;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['citizen', 'officer', 'admin', 'cm'],
      default: 'citizen',
    },
    phone: String,
    isVerified: { type: Boolean, default: false },
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
  },
  { timestamps: true }
);

// Never return passwordHash in API responses
// eslint-disable-next-line @typescript-eslint/no-explicit-any
UserSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    delete ret.passwordHash;
    return ret;
  },
});


const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
