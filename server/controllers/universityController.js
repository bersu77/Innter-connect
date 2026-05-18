import University from '../models/University.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { Verification } from '../models/Verification.js';
import { logAudit } from '../services/audit.js';
import { notify } from '../services/notification.js';

// Organization Management (PKG_06 / UC002) — university profile + student verification.
const PROFILE_FIELDS = [
  'name',
  'email',
  'domain',
  'country',
  'city',
  'phone',
  'address',
  'website',
  'accreditationCode',
  'departments',
];

// @route GET /api/universities/me
export const getMyProfile = async (req, res, next) => {
  try {
    const profile = await University.findOne({ userId: req.user._id });
    res.json({ success: true, profile });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/universities/me  — create or update.
export const updateMyProfile = async (req, res, next) => {
  try {
    const updates = {};
    for (const field of PROFILE_FIELDS) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const existing = await University.findOne({ userId: req.user._id });
    if (!existing && !updates.name) {
      return res.status(400).json({ success: false, message: 'University name is required' });
    }

    const profile = await University.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updates, $setOnInsert: { admins: [req.user._id] } },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
    );

    const profileComplete = Boolean(profile.name && profile.country && profile.city);
    await User.findByIdAndUpdate(req.user._id, { profileComplete });

    await logAudit({
      req,
      action: 'UNIVERSITY_PROFILE_UPDATE',
      entityType: 'University',
      entityId: profile._id,
    });
    res.json({ success: true, profile, profileComplete });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/universities  — public list (students pick their university).
export const listUniversities = async (_req, res, next) => {
  try {
    const universities = await University.find()
      .select('name city country verified')
      .sort('name');
    res.json({ success: true, universities });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/universities/students  — students enrolled at this university.
export const listMyStudents = async (req, res, next) => {
  try {
    const university = await University.findOne({ userId: req.user._id });
    if (!university) return res.json({ success: true, students: [] });
    const students = await Student.find({ universityId: university._id })
      .populate('userId', 'firstName lastName email status')
      .sort('-createdAt');
    res.json({ success: true, students });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/universities/students/:studentId/verify  (UC — verify student)
export const verifyStudent = async (req, res, next) => {
  try {
    const { decision, remarks } = req.body;
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Invalid decision' });
    }
    const university = await University.findOne({ userId: req.user._id });
    if (!university) {
      return res.status(403).json({ success: false, message: 'No university profile found' });
    }
    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (String(student.universityId) !== String(university._id)) {
      return res
        .status(403)
        .json({ success: false, message: 'This student is not enrolled at your university' });
    }

    student.verificationStatus = decision === 'approved' ? 'verified' : 'rejected';
    student.universityVerifiedAt = new Date();
    student.verifiedBy = req.user._id;
    await student.save();

    await Verification.create({
      entityType: 'student',
      entityId: student._id,
      requestedBy: student.userId,
      reviewedBy: req.user._id,
      status: decision,
      remarks,
      reviewedAt: new Date(),
    });
    await User.findByIdAndUpdate(student.userId, {
      verificationStatus: decision === 'approved' ? 'verified' : 'rejected',
    });
    await notify({
      userId: student.userId,
      type: 'verification',
      title: `Academic verification ${decision}`,
      message:
        decision === 'approved'
          ? 'Your university has verified your academic profile.'
          : `Your verification was rejected. ${remarks || ''}`,
    });
    await logAudit({
      req,
      action: 'STUDENT_VERIFY',
      entityType: 'Student',
      entityId: student._id,
      metadata: { decision },
    });
    res.json({ success: true, student });
  } catch (err) {
    next(err);
  }
};
