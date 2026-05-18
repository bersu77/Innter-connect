import University from '../models/University.js';
import User from '../models/User.js';
import { logAudit } from '../services/audit.js';

// Organization Management (PKG_06 / UC002) — university profile.
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
