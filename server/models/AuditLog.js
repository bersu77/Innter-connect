import mongoose from 'mongoose';

// AuditLog collection (PDF §3.3.5.2.9) — append-only, immutable audit trail.
const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userType: String,
    action: { type: String, required: true },
    entityType: String,
    entityId: mongoose.Schema.Types.ObjectId,
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },
    ipAddress: String,
    userAgent: String,
    status: { type: String, enum: ['success', 'failure'], default: 'success' },
    errorMessage: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true },
);

auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1 });

// Append-only: audit entries are never edited once written.
const blockUpdate = function (next) {
  next(new Error('AuditLog is append-only and cannot be modified'));
};
auditLogSchema.pre('findOneAndUpdate', blockUpdate);
auditLogSchema.pre('updateOne', blockUpdate);
auditLogSchema.pre('updateMany', blockUpdate);

export default mongoose.model('AuditLog', auditLogSchema);
