import mongoose from 'mongoose';

// Task collection (PDF object/class model §2.3.6.3) — supervisor-assigned work.
const taskSchema = new mongoose.Schema(
  {
    placementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Placement', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
  },
  { timestamps: true },
);

taskSchema.index({ placementId: 1 });
taskSchema.index({ studentId: 1, status: 1 });

export default mongoose.model('Task', taskSchema);
