import Placement from '../models/Placement.js';
import Student from '../models/Student.js';
import Company from '../models/Company.js';
import University from '../models/University.js';
import User from '../models/User.js';
import { logAudit } from '../services/audit.js';
import { notify } from '../services/notification.js';

// Placement management (PKG_05 / UC009).

// @route GET /api/placements  — scoped to the caller's role.
export const listPlacements = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.userType === 'student') {
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
    // Supervisors see placements they supervise.
    if ((req.user.roles || []).includes('supervisor')) {
      delete query.companyId;
      query.supervisorId = req.user._id;
    }

    const placements = await Placement.find(query)
      .populate('internshipId', 'title')
      .populate('companyId', 'name')
      .populate('supervisorId', 'firstName lastName')
      .populate({ path: 'studentId', select: 'major userId', populate: { path: 'userId', select: 'firstName lastName email' } })
      .sort('-createdAt');
    res.json({ success: true, placements });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/placements/:id/supervisor  (company) — assign a supervisor (UC009).
export const assignSupervisor = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    const placement = await Placement.findById(req.params.id).populate('internshipId', 'title');
    if (!placement) return res.status(404).json({ success: false, message: 'Placement not found' });
    if (!company || String(placement.companyId) !== String(company._id)) {
      return res.status(403).json({ success: false, message: 'This is not your placement' });
    }
    const supervisor = await User.findById(req.body.supervisorId);
    if (!supervisor) {
      return res.status(404).json({ success: false, message: 'Supervisor not found' });
    }

    placement.supervisorId = supervisor._id;
    if (placement.status === 'pending') placement.status = 'active';
    if (!placement.startDate) placement.startDate = new Date();
    await placement.save();

    await logAudit({
      req,
      action: 'SUPERVISOR_ASSIGN',
      entityType: 'Placement',
      entityId: placement._id,
      metadata: { supervisorId: supervisor._id },
    });
    await notify({
      userId: supervisor._id,
      type: 'placement',
      title: 'You have been assigned a student',
      message: `You are now supervising an intern for "${placement.internshipId?.title}".`,
    });
    const student = await Student.findById(placement.studentId);
    if (student?.userId) {
      await notify({
        userId: student.userId,
        type: 'placement',
        title: 'Supervisor assigned',
        message: `${supervisor.firstName} ${supervisor.lastName} will supervise your internship.`,
      });
    }
    res.json({ success: true, placement });
  } catch (err) {
    next(err);
  }
};
