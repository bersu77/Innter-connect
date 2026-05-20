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

// Immutable once submitted.
assessmentSchema.pre('save', function (next) {
  if (!this.isNew && this.submitted && !this.isModified('submitted')) {
    return next(new Error('A submitted assessment cannot be modified'));
  }
  next();
});

export default mongoose.model('Assessment', assessmentSchema);
