import mongoose from 'mongoose';

// Verification collection (PDF §3.3.5.2.8) — entity verification requests.
const documentSchema = new mongoose.Schema(
  {
    filename: String,
    path: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const verificationSchema = new mongoose.Schema(
  {
    entityType: { type: String, enum: ['student', 'company', 'university'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    remarks: String,
    rejectionReason: String,
    documents: { type: [documentSchema], default: [] },
    requestedAt: { type: Date, default: Date.now },
    reviewedAt: Date,
  },
  { timestamps: true },
);

verificationSchema.index({ entityType: 1, entityId: 1 });
verificationSchema.index({ status: 1 });

export const Verification = mongoose.model('Verification', verificationSchema);

// VerificationAppeal — appeal against a rejected verification.
const verificationAppealSchema = new mongoose.Schema(
  {
    verificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Verification', required: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    status: { type: String, enum: ['pending', 'upheld', 'overturned'], default: 'pending' },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submittedAt: { type: Date, default: Date.now },
    decidedAt: Date,
  },
  { timestamps: true },
);

export const VerificationAppeal = mongoose.model('VerificationAppeal', verificationAppealSchema);

export default Verification;
