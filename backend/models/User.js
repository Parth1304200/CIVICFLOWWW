const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password by default
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'manager', 'sales', 'citizen', 'cm'],
        message: 'Role must be admin, manager, sales, citizen, or cm',
      },
      default: 'citizen',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    address: {
      type: String,
      default: '',
    },
    gender: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    isProfileSetup: {
      type: Boolean,
      default: false,
    },
    surname: {
      type: String,
      default: '',
    },
    dob: {
      type: String,
      default: '',
    },
    photo: {
      type: String,
      default: '',
    },
    nagrikId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──────────────────────────────────────────────
// Note: email index is already created by unique: true
userSchema.index({ role: 1 });

// ── Pre-save: hash password ─────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method: compare password ───────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Remove password from JSON output ────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
