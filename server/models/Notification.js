import mongoose from 'mongoose';

// Notification collection (PDF §3.3.5.2.10) — transient, TTL-expiring.
const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedEntity: {
      type: { type: String },
      id: mongoose.Schema.Types.ObjectId,
    },
    link: String,
    read: { type: Boolean, default: false },
    readAt: Date,
    channel: { type: String, enum: ['in_app', 'email', 'sms'], default: 'in_app' },
    status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'sent' },
    retryCount: { type: Number, default: 0 },
    lastRetryAt: Date,
    // Auto-expire 90 days after creation unless overridden.
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Notification', notificationSchema);
