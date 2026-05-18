import mongoose from 'mongoose';

// Message — a chat entry in a placement thread (supervisor ↔ student).
// Each placement is one conversation between the intern and their supervisor.
const messageSchema = new mongoose.Schema(
  {
    placementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Placement', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['student', 'supervisor'], required: true },
    body: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

messageSchema.index({ placementId: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);
