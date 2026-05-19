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

// @route POST /api/students/me/portfolio  — add a work-showcase item. Each item
// is either a titled link or an uploaded image/file.
export const addPortfolioItem = async (req, res, next) => {
  try {
    const { title, description, link } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'A title is required' });
    }
    const item = { title: String(title).trim(), description };
    if (req.file) {
      item.filename = req.file.originalname;
      item.path = `/uploads/${req.file.filename}`;
    } else if (link && String(link).trim()) {
      item.link = String(link).trim();
    } else {
      return res
        .status(400)
        .json({ success: false, message: 'Add a link or upload a file for this item' });
    }
    const profile = await Student.findOneAndUpdate(
      { userId: req.user._id },
      { $push: { portfolio: item } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    await logAudit({
      req,
      action: 'STUDENT_PROFILE_UPDATE',
      entityType: 'Student',
      entityId: profile._id,
    });
    res.json({ success: true, portfolio: profile.portfolio });
  } catch (err) {
    next(err);
  }
};

// @route DELETE /api/students/me/portfolio/:index  — remove a portfolio item.
export const removePortfolioItem = async (req, res, next) => {
  try {
    const index = Number(req.params.index);
    const profile = await Student.findOne({ userId: req.user._id });
    if (!profile || !Number.isInteger(index) || !profile.portfolio?.[index]) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' });
    }
    profile.portfolio.splice(index, 1);
    await profile.save();
    res.json({ success: true, portfolio: profile.portfolio });
  } catch (err) {
    next(err);
  }
};
