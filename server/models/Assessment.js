import mongoose from 'mongoose';

// Assessment collection (PDF object/class model §2.3.6.3) — supervisor evaluation.
const criterionSchema = new mongoose.Schema(
  {
    name: String,
    score: { type: Number, min: 0, max: 100 },
  },
  { _id: false },
);

const assessmentSchema = new mongoose.Schema(
  {
    placementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Placement', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, min: 0, max: 100 },
    remarks: String,
    criteria: { type: [criterionSchema], default: [] },
    submitted: { type: Boolean, default: false },
    submittedDate: Date,
  },
  { timestamps: true },
);

assessmentSchema.index({ placementId: 1 });
assessmentSchema.index({ studentId: 1 });

// Supervisors may revise a submitted assessment — the audit log records every
// edit. `submittedDate` is preserved across edits so the original submission
// moment is never lost.

export default mongoose.model('Assessment', assessmentSchema);
