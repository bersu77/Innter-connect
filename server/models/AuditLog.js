import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: mongoose.Schema.Types.ObjectId,
    details: String,
    ip: String,
    userAgent: String,
  },
  { timestamps: true }
);

export default mongoose.model('AuditLog', auditLogSchema);
