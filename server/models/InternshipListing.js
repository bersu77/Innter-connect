import mongoose from 'mongoose';

const internshipListingSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    requirements: [String],
    location: { type: String, default: '' },
    workMode: { type: String, enum: ['remote', 'onsite', 'hybrid'], default: 'onsite' },
    industry: String,
    duration: String,
    isPaid: { type: Boolean, default: false },
    compensation: String,
    applicationDeadline: Date,
    maxApplicants: Number,
    status: { type: String, enum: ['draft', 'open', 'closed', 'filled'], default: 'draft' },
    skills: [String],
  },
  { timestamps: true }
);

export default mongoose.model('InternshipListing', internshipListingSchema);
