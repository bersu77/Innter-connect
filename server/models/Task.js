import mongoose from 'mongoose';

// Task collection (PDF object/class model §2.3.6.3) — supervisor-assigned work.
const taskSchema = new mongoose.Schema(
  {
    placementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Placement', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Per-student sequential identifier, set by the server on creation — never
    // editable. Counts from 1 upward within each student's own task list, so the
    // same task assigned to several students is numbered differently for each.
    // Surfaced as a "TSK-0042" tag via the `tag` virtual below.
    taskNumber: { type: Number },
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
    // Optional rubric breakdown — when present, the supervisor graded the
    // task across multiple weighted criteria whose `maxScore`s sum to 100.
    // `task.score` is then the sum of `score` across all rubric rows; the
    // rubric is the source of truth, `score` is the cached total.
    // Tasks graded before this feature have no rubric — `score` is the flat
    // number the supervisor typed; both shapes coexist.
    rubric: {
      type: [
        {
          _id: false,
          criterion: { type: String, required: true, trim: true },
          maxScore: { type: Number, required: true, min: 1, max: 100 },
          score: { type: Number, required: true, min: 0 },
        },
      ],
      default: [],
    },
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
      // Optional supporting documents the student attaches to the appeal.
      documents: [
        {
          filename: String,
          path: String,
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
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
// taskNumber is unique within a student's list, not globally.
taskSchema.index({ studentId: 1, taskNumber: 1 }, { unique: true });

export default mongoose.model('Task', taskSchema);
