import mongoose from 'mongoose';

// Placement collection (PDF §3.3.5.2.7) — confirmed internship engagement.
const placementSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      unique: true,
    },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    internshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },
    supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startDate: Date,
    expectedEndDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'terminated'],
      default: 'pending',
    },
    finalReport: {
      filename: String,
      path: String,
      submittedAt: Date,
    },
    completionApprovedBySupervisor: { type: Boolean, default: false },
    completionValidatedByUniversity: { type: Boolean, default: false },
    confirmedAt: Date,
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

placementSchema.index({ studentId: 1 });
placementSchema.index({ companyId: 1 });
placementSchema.index({ supervisorId: 1 });
placementSchema.index({ status: 1 });

export default mongoose.model('Placement', placementSchema);
