import mongoose from 'mongoose';

// Application collection (PDF §3.3.5.2.6) — internship application lifecycle.
export const APPLICATION_STATUSES = [
  'submitted',
  'under_review',
  'shortlisted',
  'offered',
  'accepted',
  'rejected',
  'withdrawn',
];

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: APPLICATION_STATUSES },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    note: String,
  },
  { _id: false },
);

const noteSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const attachmentSchema = new mongoose.Schema(
  {
    filename: String,
    path: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const applicationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    internshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },
    // The applicant's university verifies the student (genuine enrolment +
    // documents) before the company may act on the application.
    universityVerification: {
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: Date,
      note: String,
    },
    coverLetter: String,
    attachments: { type: [attachmentSchema], default: [] },
    applicationScore: { type: Number, default: 0 },
    status: { type: String, enum: APPLICATION_STATUSES, default: 'submitted' },
    rejectionReason: String,
    rejectionDate: Date,
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    shortlistedAt: Date,
    notes: { type: [noteSchema], default: [] },
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  { timestamps: true },
);

// One application per student per internship.
applicationSchema.index({ studentId: 1, internshipId: 1 }, { unique: true });
applicationSchema.index({ companyId: 1, status: 1 });
applicationSchema.index({ internshipId: 1 });

export default mongoose.model('Application', applicationSchema);
