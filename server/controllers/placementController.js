import Placement from '../models/Placement.js';
import Student from '../models/Student.js';
import Company from '../models/Company.js';
import University from '../models/University.js';
import User from '../models/User.js';
import { logAudit } from '../services/audit.js';
import { notify } from '../services/notification.js';

// Placement management (PKG_05 / UC009, UC018).

// @route GET /api/placements  — scoped to the caller's role.
export const listPlacements = async (req, res, next) => {
  try {
    const query = {};
    const isSupervisor =
      req.user.userType === 'company' && (req.user.roles || []).includes('supervisor');

    if (isSupervisor) {
      // Supervisors see the placements they supervise.
      query.supervisorId = req.user._id;
    } else if (req.user.userType === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) return res.json({ success: true, placements: [] });
      query.studentId = student._id;
    } else if (req.user.userType === 'company') {
      const company = await Company.findOne({ userId: req.user._id });
      if (!company) return res.json({ success: true, placements: [] });
      query.companyId = company._id;
    } else if (req.user.userType === 'university') {
      const university = await University.findOne({ userId: req.user._id });
      if (!university) return res.json({ success: true, placements: [] });
      query.universityId = university._id;
    }

    const placements = await Placement.find(query)
      .populate('internshipId', 'title')
      .populate('companyId', 'name')
      .populate('supervisorId', 'firstName lastName username')
      .populate({ path: 'studentId', select: 'major userId', populate: { path: 'userId', select: 'firstName lastName email username' } })
      .sort('-createdAt');
    res.json({ success: true, placements });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/placements/:id/supervisor  (company) — assign OR reassign a supervisor.
// On reassignment the manager chooses mode: 'continue' (new supervisor inherits the
// existing chat thread) or 'fresh' (a new conversation starts).
export const assignSupervisor = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    const placement = await Placement.findById(req.params.id).populate('internshipId', 'title');
    if (!placement) return res.status(404).json({ success: false, message: 'Placement not found' });
    if (!company || String(placement.companyId) !== String(company._id)) {
      return res.status(403).json({ success: false, message: 'This is not your placement' });
    }
    const supervisor = await User.findById(req.body.supervisorId);
    if (!supervisor || !(supervisor.roles || []).includes('supervisor')) {
      return res.status(404).json({ success: false, message: 'Supervisor not found' });
    }
    if (supervisor.companyId && String(supervisor.companyId) !== String(company._id)) {
      return res
        .status(403)
        .json({ success: false, message: 'That supervisor belongs to another company' });
    }

    const previousId = placement.supervisorId;
    const isReassignment = Boolean(previousId);
    if (isReassignment && String(previousId) === String(supervisor._id)) {
      return res
        .status(400)
        .json({ success: false, message: 'That supervisor is already assigned' });
    }
    const mode = isReassignment ? (req.body.mode === 'fresh' ? 'fresh' : 'continue') : 'initial';
    const now = new Date();

    if (isReassignment) {
      const open = placement.supervisorHistory.find(
        (h) => String(h.supervisorId) === String(previousId) && !h.endedAt,
      );
      if (open) open.endedAt = now;
    }
    placement.supervisorHistory.push({ supervisorId: supervisor._id, assignedAt: now, mode });
    placement.supervisorId = supervisor._id;
    if (placement.status === 'pending') placement.status = 'active';
    if (!placement.startDate) placement.startDate = now;
    // Chat-thread boundary: a fresh reassignment (or the initial assignment) moves it.
    if (mode === 'fresh' || !placement.engagementStartedAt) {
      placement.engagementStartedAt = now;
    }
    await placement.save();

    await logAudit({
      req,
      action: isReassignment ? 'SUPERVISOR_REASSIGN' : 'SUPERVISOR_ASSIGN',
      entityType: 'Placement',
      entityId: placement._id,
      metadata: { supervisorId: supervisor._id, mode },
    });

    await notify({
      userId: supervisor._id,
      type: 'placement',
      title: 'You have been assigned a student',
      message: `You are now supervising an intern for "${placement.internshipId?.title}".${
        mode === 'continue' ? ' You are continuing an existing conversation.' : ''
      }`,
    });
    const student = await Student.findById(placement.studentId);
    if (student?.userId) {
      await notify({
        userId: student.userId,
        type: 'placement',
        title: isReassignment ? 'Your supervisor has changed' : 'Supervisor assigned',
        message: `${supervisor.firstName} ${supervisor.lastName} ${
          isReassignment ? 'is now your supervisor' : 'will supervise your internship'
        }.`,
      });
    }
    if (isReassignment && previousId) {
      await notify({
        userId: previousId,
        type: 'placement',
        title: 'Supervision reassigned',
        message: `You are no longer supervising "${placement.internshipId?.title}".`,
      });
    }
    res.json({ success: true, placement });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/placements/:id/report  (student, UC018) — submit the final report.
export const submitFinalReport = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No report file uploaded' });
    }
    const student = await Student.findOne({ userId: req.user._id });
    const placement = await Placement.findById(req.params.id);
    if (!placement) return res.status(404).json({ success: false, message: 'Placement not found' });
    if (!student || String(placement.studentId) !== String(student._id)) {
      return res.status(403).json({ success: false, message: 'This is not your placement' });
    }

    placement.finalReport = {
      filename: req.file.originalname,
      path: `/uploads/${req.file.filename}`,
      submittedAt: new Date(),
    };
    await placement.save();

    await logAudit({
      req,
      action: 'FINAL_REPORT_SUBMIT',
      entityType: 'Placement',
      entityId: placement._id,
    });
    if (placement.supervisorId) {
      await notify({
        userId: placement.supervisorId,
        type: 'placement',
        title: 'Final report submitted',
        message: 'A student has submitted their final internship report for review.',
      });
    }
    res.json({ success: true, placement });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/placements/:id/confirm-completion  (supervisor, UC018)
export const confirmCompletion = async (req, res, next) => {
  try {
    const placement = await Placement.findById(req.params.id);
    if (!placement) return res.status(404).json({ success: false, message: 'Placement not found' });
    if (String(placement.supervisorId) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ success: false, message: 'You are not the supervisor for this placement' });
    }
    if (!placement.finalReport?.submittedAt) {
      return res
        .status(400)
        .json({ success: false, message: 'The student has not submitted a final report yet' });
    }

    placement.completionApprovedBySupervisor = true;
    await placement.save();

    await logAudit({
      req,
      action: 'COMPLETION_CONFIRM',
      entityType: 'Placement',
      entityId: placement._id,
    });
    if (placement.universityId) {
      const university = await University.findById(placement.universityId);
      if (university?.userId) {
        await notify({
          userId: university.userId,
          type: 'placement',
          title: 'Completion awaiting validation',
          message: 'A supervisor confirmed an internship completion — please validate it.',
        });
      }
    }
    res.json({ success: true, placement });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/placements/:id/validate-completion  (university, UC018)
export const validateCompletion = async (req, res, next) => {
  try {
    const university = await University.findOne({ userId: req.user._id });
    const placement = await Placement.findById(req.params.id);
    if (!placement) return res.status(404).json({ success: false, message: 'Placement not found' });
    if (!university || String(placement.universityId) !== String(university._id)) {
      return res.status(403).json({ success: false, message: 'This is not your university placement' });
    }
    if (!placement.completionApprovedBySupervisor) {
      return res
        .status(400)
        .json({ success: false, message: 'The supervisor has not confirmed completion yet' });
    }

    placement.completionValidatedByUniversity = true;
    placement.status = 'completed';
    placement.endDate = new Date();
    await placement.save();

    await logAudit({
      req,
      action: 'COMPLETION_VALIDATE',
      entityType: 'Placement',
      entityId: placement._id,
    });
    const student = await Student.findById(placement.studentId);
    if (student?.userId) {
      await notify({
        userId: student.userId,
        type: 'placement',
        title: 'Internship completed',
        message: 'Your internship has been completed and validated by your university.',
      });
    }
    res.json({ success: true, placement });
  } catch (err) {
    next(err);
  }
};
