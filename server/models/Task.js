import mongoose from 'mongoose';

// Task collection (PDF object/class model §2.3.6.3) — supervisor-assigned work.
const taskSchema = new mongoose.Schema(
  {
    placementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Placement', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Unique sequential identifier, set by the server on creation — never editable.
    // Surfaced as a "TSK-0042" tag via the `tag` virtual below. Sparse so the
    // unique index tolerates any legacy task created before this field existed.
    taskNumber: { type: Number, unique: true, sparse: true },
    title: { type: String, required: true, trim: true },
    description: String,
    deadline: Date,
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'completed', 'overdue'],
      default: 'assigned',
    },
    progressNote: String,
    completedAt: Date,
    // Deliverables the supervisor requires the student to submit with this task.
    requiredDeliverables: {
      document: { type: Boolean, default: false },
      link: { type: Boolean, default: false },
      note: { type: Boolean, default: false },
    },
    // What the student submitted.
    submission: {
      documentName: String,
      documentPath: String,
      link: String,
      note: String,
      submittedAt: Date,
    },
    // Grading — set by the supervisor after the task is done.
    maxScore: { type: Number, default: 100 },
    score: { type: Number },
    feedback: { type: String },
    gradedAt: Date,
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // True when the score of 0 was applied automatically because the deadline
    // passed without a completed submission (not a deliberate supervisor grade).
    autoZeroed: { type: Boolean, default: false },
    // A student's appeal against the grade. The placement supervisor resolves it,
    // either upholding the grade or adjusting the score.
    gradeAppeal: {
      reason: String,
      status: { type: String, enum: ['pending', 'upheld', 'adjusted'] },
      submittedAt: Date,
      response: String,
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      resolvedAt: Date,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

// Human-readable tag derived from the sequential number, e.g. "TSK-0042".
taskSchema.virtual('tag').get(function () {
  return this.taskNumber ? `TSK-${String(this.taskNumber).padStart(4, '0')}` : null;
});

taskSchema.index({ placementId: 1 });
taskSchema.index({ studentId: 1, status: 1 });

export default mongoose.model('Task', taskSchema);
