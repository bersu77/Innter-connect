import mongoose from 'mongoose';

// Invitation — supports FR11 / UC006 (university invites partner companies).
// Backing store for the "send invitations and track status" requirement.
const invitationSchema = new mongoose.Schema(
  {
    universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'University', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    status: { type: String, enum: ['sent', 'accepted', 'declined'], default: 'sent' },
    respondedAt: Date,
  },
  { timestamps: true },
);

invitationSchema.index({ universityId: 1 });
invitationSchema.index({ companyId: 1 });

export default mongoose.model('Invitation', invitationSchema);
