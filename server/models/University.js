import mongoose from 'mongoose';

// University collection (PDF §3.3.5.2.3) — organizational profile.
const verificationRulesSchema = new mongoose.Schema(
  {
    minGPA: { type: Number, default: 0 },
    allowedGraduationYears: { type: [Number], default: [] },
    allowedMajors: { type: [String], default: [] },
  },
  { _id: false },
);

const universitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, unique: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    domain: String,
    country: String,
    city: String,
    phone: String,
    address: String,
    website: String,
    accreditationCode: String,
    verified: { type: Boolean, default: false },
    verificationDate: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    departments: { type: [String], default: [] },
    admins: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
    studentCount: { type: Number, default: 0 },
    interns: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }], default: [] },
    verificationRules: { type: verificationRulesSchema, default: () => ({}) },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  },
  { timestamps: true },
);

export default mongoose.model('University', universitySchema);
