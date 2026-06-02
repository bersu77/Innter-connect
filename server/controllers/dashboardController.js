import Student from '../models/Student.js';
import Company from '../models/Company.js';
import University from '../models/University.js';
import Internship from '../models/Internship.js';
import Application from '../models/Application.js';
import Placement from '../models/Placement.js';
import Task from '../models/Task.js';
import Assessment from '../models/Assessment.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

// @route GET /api/dashboard  — role-aware dashboard summary (UC019 + FR dashboards).
export const getDashboard = async (req, res, next) => {
  try {
    const isSupervisor =
      req.user.userType === 'company' && (req.user.roles || []).includes('supervisor');
    const role = isSupervisor ? 'supervisor' : req.user.userType;
    const unread = await Notification.countDocuments({ userId: req.user._id, read: false });
    let stats = {};

    if (isSupervisor) {
      stats = {
        interns: await Placement.countDocuments({ supervisorId: req.user._id }),
        activeInterns: await Placement.countDocuments({
          supervisorId: req.user._id,
          status: 'active',
        }),
        tasksAssigned: await Task.countDocuments({ assignedBy: req.user._id }),
        tasksToGrade: await Task.countDocuments({
          assignedBy: req.user._id,
          status: 'completed',
          gradedAt: { $exists: false },
        }),
        assessments: await Assessment.countDocuments({ supervisorId: req.user._id }),
      };
    } else if (role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (student) {
        const applications = await Application.find({ studentId: student._id });
        stats = {
          applications: applications.length,
          pending: applications.filter((a) =>
            ['submitted', 'under_review', 'shortlisted'].includes(a.status),
          ).length,
          offers: applications.filter((a) => a.status === 'offered').length,
          placements: await Placement.countDocuments({ studentId: student._id }),
        };
      }
    } else if (role === 'company') {
      const company = await Company.findOne({ userId: req.user._id });
      if (company) {
        stats = {
          internships: await Internship.countDocuments({ companyId: company._id }),
          activeInternships: await Internship.countDocuments({ companyId: company._id, status: 'active' }),
          applications: await Application.countDocuments({ companyId: company._id }),
          toReview: await Application.countDocuments({
            companyId: company._id,
            status: { $in: ['submitted', 'under_review'] },
          }),
          placements: await Placement.countDocuments({ companyId: company._id }),
        };
      }
    } else if (role === 'university') {
      const university = await University.findOne({ userId: req.user._id });
      if (university) {
        stats = {
          students: await Student.countDocuments({ universityId: university._id }),
          verifiedStudents: await Student.countDocuments({
            universityId: university._id,
            verificationStatus: 'verified',
          }),
          pendingStudents: await Student.countDocuments({
            universityId: university._id,
            verificationStatus: { $in: ['unverified', 'pending'] },
          }),
          placements: await Placement.countDocuments({ universityId: university._id }),
        };
      }
    } else if (role === 'admin') {
      stats = {
        users: await User.countDocuments(),
        companies: await Company.countDocuments(),
        universities: await University.countDocuments(),
        internships: await Internship.countDocuments(),
        applications: await Application.countDocuments(),
        pendingOrganizations:
          (await Company.countDocuments({ verified: false })) +
          (await University.countDocuments({ verified: false })),
      };
    }

    res.json({ success: true, role, unread, stats });
  } catch (err) {
    next(err);
  }
};
