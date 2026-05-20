import Assessment from '../models/Assessment.js';
import Placement from '../models/Placement.js';
import Student from '../models/Student.js';
import { logAudit } from '../services/audit.js';
import { notify } from '../services/notification.js';

// Assessments (PKG_05 / UC011, FR5, FR7).

// @route POST /api/assessments  (student) — request a performance assessment.
export const requestAssessment = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(400).json({ success: false, message: 'Student profile required' });
    }
    const placement = await Placement.findById(req.body.placementId);
    if (!placement) {
      return res.status(404).json({ success: false, message: 'Placement not found' });
    }
    if (String(placement.studentId) !== String(student._id)) {
      return res.status(403).json({ success: false, message: 'This is not your placement' });
    }
    if (!placement.supervisorId) {
      return res
        .status(400)
        .json({ success: false, message: 'A supervisor has not been assigned yet' });
    }
    const existing = await Assessment.findOne({ placementId: placement._id });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: 'An assessment already exists for this placement' });
    }

    const assessment = await Assessment.create({
      placementId: placement._id,
      studentId: student._id,
      supervisorId: placement.supervisorId,
      submitted: false,
    });
    await logAudit({
      req,
      action: 'ASSESSMENT_REQUEST',
      entityType: 'Assessment',
      entityId: assessment._id,
    });
    await notify({
      userId: placement.supervisorId,
      type: 'assessment',
      title: 'Assessment requested',
      message: 'A student has requested a performance assessment.',
    });
    res.status(201).json({ success: true, assessment });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/assessments  — student sees own; supervisor sees ones assigned to them.
export const listAssessments = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.userType === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) return res.json({ success: true, assessments: [] });
      query.studentId = student._id;
    } else {
      query.supervisorId = req.user._id;
    }
    const assessments = await Assessment.find(query)
      .populate({ path: 'studentId', select: 'userId major', populate: { path: 'userId', select: 'firstName lastName' } })
      .sort('-createdAt');
    res.json({ success: true, assessments });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/assessments/:id  (supervisor) — fill & submit OR edit.
// First call: writes the fields and flips `submitted: true` with a
// `submittedDate` stamp. Subsequent calls overwrite the fields but keep
// `submittedDate` intact so the original submission moment is preserved; the
// audit trail captures every edit.
export const submitAssessment = async (req, res, next) => {
  try {
    const { score, remarks, criteria } = req.body;
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }
    if (String(assessment.supervisorId) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ success: false, message: 'You are not the assigned supervisor' });
    }

    const wasSubmitted = assessment.submitted;

    assessment.score = score;
    assessment.remarks = remarks;
    if (Array.isArray(criteria)) assessment.criteria = criteria;
    if (!wasSubmitted) {
      assessment.submitted = true;
      assessment.submittedDate = new Date();
    }
    await assessment.save();

    await logAudit({
      req,
      action: wasSubmitted ? 'ASSESSMENT_EDIT' : 'ASSESSMENT_SUBMIT',
      entityType: 'Assessment',
      entityId: assessment._id,
    });
    const student = await Student.findById(assessment.studentId);
    if (student?.userId) {
      await notify({
        userId: student.userId,
        type: 'assessment',
        title: wasSubmitted ? 'Assessment updated' : 'Assessment completed',
        message: wasSubmitted
          ? `Your supervisor revised your performance assessment (score: ${score}).`
          : `Your supervisor submitted your performance assessment (score: ${score}).`,
      });
    }
    res.json({ success: true, assessment });
  } catch (err) {
    next(err);
  }
};
