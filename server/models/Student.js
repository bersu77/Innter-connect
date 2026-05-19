import mongoose from 'mongoose';

// Student collection (PDF §3.3.5.2.2) — domain-specific student profile.
const cvSchema = new mongoose.Schema(
  {
    filename: String,
    path: String,
    uploadedAt: Date,
    version: { type: Number, default: 1 },
  },
  { _id: false },
);

const certificationSchema = new mongoose.Schema(
  {
    name: String,
    issuer: String,
    issuedAt: Date,
    credentialUrl: String,
  },
  { _id: false },
);

// Prior work experience the student lists on their profile.
const experienceSchema = new mongoose.Schema(
  {
    role: String,
    organization: String,
    startDate: String,
    endDate: String,
    description: String,
  },
  { _id: false },
);

// A showcase of the student's work — a titled link to a repo, drive, etc.
const portfolioSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    link: String,
  },
  { _id: false },
);

const studentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },
    studentId: { type: String, trim: true },
    enrollmentYear: Number,
    graduationYear: Number,
    major: { type: String, trim: true },
    gpa: { type: Number, min: 0, max: 4 },
    academicStanding: {
      type: String,
      enum: ['good', 'warning', 'probation'],
      default: 'good',
    },
    skills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    cv: cvSchema,
    // Optional profile extras — suggested as application attachments at apply time.
    certifications: { type: [certificationSchema], default: [] },
    experience: { type: [experienceSchema], default: [] },
    portfolio: { type: [portfolioSchema], default: [] },
    availableSince: Date,
    desiredLocations: { type: [String], default: [] },
    workAuthorization: { type: String, default: '' },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },
    universityVerifiedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

studentSchema.index({ universityId: 1 });
studentSchema.index({ verificationStatus: 1 });

export default mongoose.model('Student', studentSchema);
