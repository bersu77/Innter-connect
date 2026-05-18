import Application from '../models/Application.js';
import Internship from '../models/Internship.js';
import Student from '../models/Student.js';
import Company from '../models/Company.js';
import { logAudit } from '../services/audit.js';
import { notify } from '../services/notification.js';

// Application & Selection (PKG_05 / UC003, UC004, UC007, UC008, FR3, FR4, FR9, FR10).

// @route POST /api/applications  (student) — apply to an internship.
export const applyToInternship = async (req, res, next) => {
  try {
    const { internshipId, coverLetter } = req.body;
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res
        .status(400)
        .json({ success: false, message: 'Complete your student profile before applying' });
    }
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }
    if (internship.status !== 'active') {
      return res
        .status(400)
        .json({ success: false, message: 'This internship is not accepting applications' });
    }
    const existing = await Application.findOne({ studentId: student._id, internshipId });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: 'You have already applied to this internship' });
    }

    const application = await Application.create({
      studentId: student._id,
      internshipId,
      companyId: internship.companyId,
      universityId: student.universityId,
      coverLetter,
      status: 'submitted',
      submittedAt: new Date(),
      statusHistory: [{ status: 'submitted', changedBy: req.user._id }],
    });
    await Internship.findByIdAndUpdate(internshipId, {
      $addToSet: { applications: application._id },
    });
    await logAudit({
      req,
      action: 'APPLICATION_SUBMIT',
      entityType: 'Application',
      entityId: application._id,
    });

    const company = await Company.findById(internship.companyId);
    if (company?.userId) {
      await notify({
        userId: company.userId,
        type: 'application',
        title: 'New application received',
        message: `A student applied to your "${internship.title}" internship.`,
        relatedEntity: { type: 'Application', id: application._id },
      });
    }
    res.status(201).json({ success: true, application });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: 'You have already applied to this internship' });
    }
    next(err);
  }
};

// @route GET /api/applications  — student sees own; company sees applications to its internships.
export const listApplications = async (req, res, next) => {
  try {
    if (req.user.userType === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) return res.json({ success: true, applications: [] });
      const applications = await Application.find({ studentId: student._id })
        .populate({
          path: 'internshipId',
          select: 'title status companyId',
          populate: { path: 'companyId', select: 'name' },
        })
        .sort('-submittedAt');
      return res.json({ success: true, applications });
    }
    if (req.user.userType === 'company') {
      const company = await Company.findOne({ userId: req.user._id });
      if (!company) return res.json({ success: true, applications: [] });
      const query = { companyId: company._id };
      if (req.query.internshipId) query.internshipId = req.query.internshipId;
      if (req.query.status) query.status = req.query.status;
      const applications = await Application.find(query)
        .populate('internshipId', 'title')
        .populate({
          path: 'studentId',
          select: 'major gpa userId',
          populate: { path: 'userId', select: 'firstName lastName email' },
        })
        .sort('-submittedAt');
      return res.json({ success: true, applications });
    }
    res.json({ success: true, applications: [] });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/applications/:id
export const getApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate({
        path: 'internshipId',
        select: 'title description companyId',
        populate: { path: 'companyId', select: 'name' },
      })
      .populate({
        path: 'studentId',
        select: 'major gpa skills cv userId',
        populate: { path: 'userId', select: 'firstName lastName email' },
      });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    res.json({ success: true, application });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/applications/:id/status  (company) — review / shortlist / offer / reject.
export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const allowed = ['under_review', 'shortlisted', 'offered', 'rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const company = await Company.findOne({ userId: req.user._id });
    const application = await Application.findById(req.params.id).populate('internshipId', 'title');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    if (!company || String(application.companyId) !== String(company._id)) {
      return res.status(403).json({ success: false, message: 'This is not your application to review' });
    }

    application.status = status;
    application.reviewedAt = new Date();
    application.reviewedBy = req.user._id;
    if (status === 'shortlisted') application.shortlistedAt = new Date();
    if (status === 'rejected') {
      application.rejectionReason = note;
      application.rejectionDate = new Date();
    }
    application.statusHistory.push({ status, changedBy: req.user._id, note });
    await application.save();

    await logAudit({
      req,
      action: 'APPLICATION_STATUS_CHANGE',
      entityType: 'Application',
      entityId: application._id,
      metadata: { status },
    });

    const student = await Student.findById(application.studentId);
    if (student?.userId) {
      await notify({
        userId: student.userId,
        type: 'application',
        title: `Application ${status.replace('_', ' ')}`,
        message: `Your application for "${application.internshipId?.title}" is now ${status.replace('_', ' ')}.`,
        relatedEntity: { type: 'Application', id: application._id },
      });
    }
    res.json({ success: true, application });
  } catch (err) {
    next(err);
  }
};
