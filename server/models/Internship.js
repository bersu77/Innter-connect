import mongoose from 'mongoose';

// Internship collection (PDF §3.3.5.2) — opportunity postings.
const requirementsSchema = new mongoose.Schema(
  {
    minGPA: { type: Number, default: 0 },
    skills: { type: [String], default: [] },
    majors: { type: [String], default: [] },
    yearsOfStudy: { type: [Number], default: [] },
    workAuthorization: { type: String, default: '' },
  },
  { _id: false },
);

const positionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['onsite', 'remote', 'hybrid'], default: 'onsite' },
    duration: String,
    startDate: Date,
    endDate: Date,
    paid: { type: Boolean, default: false },
    stipend: { type: Number, default: 0 },
  },
  { _id: false },
);

export const INTERNSHIP_STATUSES = ['draft', 'pending', 'active', 'closed', 'archived'];

const internshipSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    locations: { type: [String], default: [] },
    requirements: { type: requirementsSchema, default: () => ({}) },
    position: { type: positionSchema, default: () => ({}) },
    applicationDeadline: { type: Date, required: [true, 'Application deadline is required'] },
    postedDate: Date,
    closedDate: Date,
    totalPositions: { type: Number, default: 1 },
    filledPositions: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
    status: { type: String, enum: INTERNSHIP_STATUSES, default: 'draft' },
    applications: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }], default: [] },
    viewCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

internshipSchema.index({ companyId: 1 });
internshipSchema.index({ status: 1 });
internshipSchema.index({ applicationDeadline: 1 });
internshipSchema.index({ title: 'text', description: 'text', tags: 'text' });

export default mongoose.model('Internship', internshipSchema);
