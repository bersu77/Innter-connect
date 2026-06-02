import mongoose from 'mongoose';

// Company collection (PDF §3.3.5.2) — organizational profile.
const companySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    industry: String,
    country: String,
    city: String,
    employees: String, // size band, e.g. "11-50"
    founded: Number,
    website: String,
    description: String,
    logo: String,
    verified: { type: Boolean, default: false },
    verificationDate: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recruiters: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    totalInternsHired: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
  },
  { timestamps: true },
);

companySchema.index({ name: 1 });
companySchema.index({ verified: 1 });

export default mongoose.model('Company', companySchema);
