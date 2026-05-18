import Company from '../models/Company.js';
import User from '../models/User.js';
import { logAudit } from '../services/audit.js';

// Organization Management (PKG_06 / UC002) — company profile.
const PROFILE_FIELDS = [
  'name',
  'email',
  'industry',
  'country',
  'city',
  'employees',
  'founded',
  'website',
  'description',
  'logo',
];

// @route GET /api/companies/me
export const getMyProfile = async (req, res, next) => {
  try {
    const profile = await Company.findOne({ userId: req.user._id });
    res.json({ success: true, profile });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/companies/me  — create or update.
export const updateMyProfile = async (req, res, next) => {
  try {
    const updates = {};
    for (const field of PROFILE_FIELDS) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const existing = await Company.findOne({ userId: req.user._id });
    if (!existing && !updates.name) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }

    const profile = await Company.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updates, $setOnInsert: { recruiters: [req.user._id] } },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
    );

    const profileComplete = Boolean(profile.name && profile.industry && profile.city);
    await User.findByIdAndUpdate(req.user._id, { profileComplete });

    await logAudit({
      req,
      action: 'COMPANY_PROFILE_UPDATE',
      entityType: 'Company',
      entityId: profile._id,
    });
    res.json({ success: true, profile, profileComplete });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/companies  — searchable list (universities find partners).
export const listCompanies = async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = {};
    if (search) query.name = new RegExp(search, 'i');
    const companies = await Company.find(query)
      .select('name industry city country verified')
      .sort('name')
      .limit(100);
    res.json({ success: true, companies });
  } catch (err) {
    next(err);
  }
};
