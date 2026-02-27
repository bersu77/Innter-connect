import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const studentProfileSchema = new mongoose.Schema(
  {
    university: { type: String, default: '' },
    major: { type: String, default: '' },
    gpa: { type: Number, min: 0, max: 4 },
    graduationYear: Number,
    verified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const companyProfileSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    industry: String,
    website: String,
    companySize: String,
    approved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const universityProfileSchema = new mongoose.Schema(
  {
    universityName: { type: String, required: true },
    country: String,
    accreditationCode: String,
    approved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: [true, 'First name is required'], trim: true },
    lastName: { type: String, required: [true, 'Last name is required'], trim: true },
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
    role: {
      type: String,
      enum: ['student', 'company', 'university', 'admin'],
      required: [true, 'Role is required'],
    },
    studentProfile: studentProfileSchema,
    companyProfile: companyProfileSchema,
    universityProfile: universityProfileSchema,
    refreshToken: { type: String, select: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare candidate password
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
