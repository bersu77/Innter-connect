import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

// Users collection (PDF §3.3.5.2.1) — foundational auth record.
// Profile data lives in the Student / Company / University collections.
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    // Optional username — supervisors log in with this; can also be set by any user.
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    firstName: { type: String, required: [true, 'First name is required'], trim: true },
    lastName: { type: String, required: [true, 'Last name is required'], trim: true },
    // Company-side users (managers, supervisors) belong to a company.
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    userType: {
      type: String,
      enum: ['student', 'university', 'company', 'admin'],
      required: [true, 'User type is required'],
    },
    // Sub-roles within a userType (e.g. supervisor, recruiter, auditor) — drives RBAC.
    roles: { type: [String], default: [] },
    permissions: { type: [String], default: [] },
    status: { type: String, enum: ['active', 'suspended', 'deleted'], default: 'active' },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },
    profileComplete: { type: Boolean, default: false },
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    accountLockedUntil: Date,
    refreshToken: { type: String, select: false },
    deletedAt: Date,
  },
  { timestamps: true },
);

userSchema.index({ userType: 1 });
userSchema.index({ status: 1 });

// Hash password before save.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.virtual('isLocked').get(function () {
  return !!this.accountLockedUntil && this.accountLockedUntil > Date.now();
});

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

export default mongoose.model('User', userSchema);
