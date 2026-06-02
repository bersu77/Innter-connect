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

// @route GET /api/companies/supervisors  — this company's own supervisors (UC009).
export const listSupervisors = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    const query = { userType: 'company', roles: 'supervisor', status: 'active' };
    if (company) query.companyId = company._id;
    const supervisors = await User.find(query)
      .select('firstName lastName email username')
      .sort('firstName');
    res.json({ success: true, supervisors });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/companies/supervisors  — the manager creates a supervisor account.
export const createSupervisor = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    if (!company) {
      return res
        .status(400)
        .json({ success: false, message: 'Create your company profile before adding supervisors' });
    }
    const { firstName, lastName, username, password } = req.body;
    if (!firstName || !lastName || !username || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'First name, last name, username and password are required' });
    }
    if (String(password).length < 8) {
      return res
        .status(400)
        .json({ success: false, message: 'Password must be at least 8 characters' });
    }
    const uname = String(username).toLowerCase().trim();
    if (await User.findOne({ username: uname })) {
      return res.status(400).json({ success: false, message: 'That username is already taken' });
    }
    // Synthetic email satisfies the required+unique email constraint; login is by username.
    const email = `${uname}@supervisor.internconnect.local`;
    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'A supervisor with that username exists' });
    }

    const supervisor = await User.create({
      firstName,
      lastName,
      email,
      username: uname,
      password,
      userType: 'company',
      roles: ['supervisor'],
      companyId: company._id,
      verificationStatus: 'verified',
      profileComplete: true,
    });
    await logAudit({
      req,
      action: 'SUPERVISOR_CREATE',
      entityType: 'User',
      entityId: supervisor._id,
    });
    res.status(201).json({
      success: true,
      supervisor: {
        id: supervisor._id,
        firstName: supervisor.firstName,
        lastName: supervisor.lastName,
        username: supervisor.username,
      },
    });
  } catch (err) {
    next(err);
  }
};
