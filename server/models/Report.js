import mongoose from 'mongoose';

// Report collection (PDF object model §2.3.6.3) — generated reports.
const reportSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['university', 'company', 'audit', 'placement', 'completion'],
      required: true,
    },
    title: String,
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filters: mongoose.Schema.Types.Mixed,
    payload: mongoose.Schema.Types.Mixed,
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

reportSchema.index({ generatedBy: 1 });
reportSchema.index({ type: 1 });

export default mongoose.model('Report', reportSchema);
