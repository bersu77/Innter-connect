import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'InternshipListing', required: true },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'shortlisted', 'offered', 'rejected', 'withdrawn'],
      default: 'submitted',
    },
    coverLetter: String,
    resumeUrl: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String,
  },
  { timestamps: true }
);

// One application per student per listing
applicationSchema.index({ student: 1, listing: 1 }, { unique: true });

export default mongoose.model('Application', applicationSchema);
