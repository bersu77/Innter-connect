import Student from '../models/Student.js';
import User from '../models/User.js';
import { logAudit } from '../services/audit.js';

// Student Management (PKG_03 / UC002) — student profile.
const PROFILE_FIELDS = [
  'universityId',
  'studentId',
  'enrollmentYear',
  'graduationYear',
  'major',
  'gpa',
  'academicStanding',
  'skills',
  'interests',
  'languages',
  'availableSince',
  'desiredLocations',
  'workAuthorization',
  'certifications',
  'experience',
  'portfolio',
];

// A profile is complete once the core academic fields and a CV are in place —
// uploading a CV is a required step in finishing the profile.
const isProfileComplete = (p) =>
  Boolean(p?.major && p?.universityId && p?.graduationYear && p?.cv?.path);

// @route GET /api/students/me
export const getMyProfile = async (req, res, next) => {
  try {
    const profile = await Student.findOne({ userId: req.user._id }).populate(
      'universityId',
      'name city country',
    );
    res.json({ success: true, profile });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/students/me  — create or update (one profile per student).
export const updateMyProfile = async (req, res, next) => {
  try {
    const updates = {};
    for (const field of PROFILE_FIELDS) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    const profile = await Student.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updates },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
    );

    const profileComplete = isProfileComplete(profile);
    await User.findByIdAndUpdate(req.user._id, { profileComplete });

    await logAudit({
      req,
      action: 'STUDENT_PROFILE_UPDATE',
      entityType: 'Student',
      entityId: profile._id,
    });
    res.json({ success: true, profile, profileComplete });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/students/me/cv  — upload CV (local disk).
export const uploadCv = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: 'No file uploaded (PDF, DOC or DOCX, max 5 MB)' });
    }
    const existing = await Student.findOne({ userId: req.user._id });
    const version = existing?.cv?.version ? existing.cv.version + 1 : 1;

    const profile = await Student.findOneAndUpdate(
      { userId: req.user._id },
      {
        $set: {
          cv: {
            filename: req.file.originalname,
            path: `/uploads/${req.file.filename}`,
            uploadedAt: new Date(),
            version,
          },
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    // Uploading the CV may complete the profile — recompute the flag.
    await User.findByIdAndUpdate(req.user._id, { profileComplete: isProfileComplete(profile) });

    await logAudit({
      req,
      action: 'STUDENT_CV_UPLOAD',
      entityType: 'Student',
      entityId: profile._id,
    });
    res.json({ success: true, cv: profile.cv });
  } catch (err) {
    next(err);
  }
};
