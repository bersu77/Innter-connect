import User from '../models/User.js';
import { Company, University, Student } from '../models/index.js';
import { logAudit } from '../services/audit.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';

// Auth controller (PKG_02 / UC001) — registration, login, sessions, lockout.
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const sendRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const publicUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  username: user.username,
  userType: user.userType,
  roles: user.roles,
  permissions: user.permissions,
  status: user.status,
  verificationStatus: user.verificationStatus,
  profileComplete: user.profileComplete,
});

// Students must register with an academic institutional email — a domain ending
// in .edu, .edu.<cc> (e.g. aau.edu.et) or .ac.<cc> (e.g. ox.ac.uk). Personal /
// consumer providers (gmail.com, yahoo.com, …) and ordinary domains are rejected.
const ACADEMIC_EMAIL = /@[^@\s]+\.(edu|edu\.[a-z]{2}|ac\.[a-z]{2})$/i;

// The name of the company/university the user belongs to, for the workspace
// header. Cosmetic — never fails auth, so any lookup error resolves to null.
async function organizationName(user) {
  try {
    if (user.userType === 'company') {
      const company = user.companyId
        ? await Company.findById(user.companyId).select('name')
        : await Company.findOne({ userId: user._id }).select('name');
      return company?.name || null;
    }
    if (user.userType === 'university') {
      const uni = await University.findOne({ userId: user._id }).select('name');
      return uni?.name || null;
    }
    if (user.userType === 'student') {
      const student = await Student.findOne({ userId: user._id }).select('universityId');
      const uni = student?.universityId
        ? await University.findById(student.universityId).select('name')
        : null;
      return uni?.name || null;
    }
  } catch {
    /* organization name is cosmetic — never break auth over it */
  }
  return null;
}

// @route POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const userType = req.body.userType || req.body.role;

    if (!firstName || !lastName || !email || !password || !userType) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (userType === 'admin') {
      return res
        .status(403)
        .json({ success: false, message: 'Administrator accounts cannot be self-registered' });
    }
    if (userType === 'student' && !ACADEMIC_EMAIL.test(String(email).trim())) {
      return res.status(400).json({
        success: false,
        message:
          'Students must register with an academic institutional email (e.g. a .edu or .edu.et university address) — personal email accounts are not accepted.',
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ firstName, lastName, email, password, userType });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    await logAudit({ req, user, action: 'USER_REGISTER', entityType: 'User', entityId: user._id });

    sendRefreshCookie(res, refreshToken);
    res.status(201).json({
      success: true,
      token: accessToken,
      user: { ...publicUser(user), organizationName: await organizationName(user) },
    });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { password } = req.body;
    // The identifier may be an email or a username (supervisors use a username).
    const identifier = (req.body.email || req.body.username || '').toLowerCase().trim();
    if (!identifier || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Email/username and password are required' });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Account lockout (PDF §2.4.3.7, UC001 business rules).
    if (user.accountLockedUntil && user.accountLockedUntil > Date.now()) {
      await logAudit({
        req,
        user,
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: user._id,
        status: 'failure',
        errorMessage: 'Account locked',
      });
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to failed login attempts. Try again later.',
      });
    }
    if (user.status === 'suspended' || user.status === 'deleted') {
      return res.status(403).json({ success: false, message: 'This account is not active.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      let justLocked = false;
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.accountLockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
        user.loginAttempts = 0;
        justLocked = true;
      }
      await user.save({ validateBeforeSave: false });
      await logAudit({
        req,
        user,
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: user._id,
        status: 'failure',
        errorMessage: 'Invalid password',
      });
      return res.status(401).json({
        success: false,
        message: justLocked
          ? 'Too many failed attempts — account locked for 15 minutes.'
          : 'Invalid credentials',
      });
    }

    // Successful login — reset counters.
    user.loginAttempts = 0;
    user.accountLockedUntil = undefined;
    user.lastLogin = new Date();
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    await logAudit({ req, user, action: 'USER_LOGIN', entityType: 'User', entityId: user._id });

    sendRefreshCookie(res, refreshToken);
    res.json({
      success: true,
      token: accessToken,
      user: { ...publicUser(user), organizationName: await organizationName(user) },
    });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/refresh
export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token' });
    }
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
    const accessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });
    sendRefreshCookie(res, newRefreshToken);
    res.json({ success: true, token: accessToken });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/logout
export const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      try {
        const decoded = verifyRefreshToken(token);
        await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
      } catch {
        // Invalid token — clearing the cookie below is enough.
      }
    }
  } catch {
    // Logout must always succeed for the client.
  }
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out' });
};

// @route GET /api/auth/me
export const getMe = async (req, res) => {
  const user = req.user.toObject ? req.user.toObject() : req.user;
  res.json({
    success: true,
    user: { ...user, organizationName: await organizationName(req.user) },
  });
};

// @route POST /api/auth/forgot-password
// Email-based reset is delivered in Phase 14; respond generically (no user enumeration).
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    await logAudit({
      req,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'User',
      metadata: { email },
    });
    res.json({
      success: true,
      message: 'If an account exists for that email, password reset instructions will be sent.',
    });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/auth/credentials — change own username and/or password.
export const updateCredentials = async (req, res, next) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (newPassword) {
      if (!currentPassword || !(await user.comparePassword(currentPassword))) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
      if (newPassword.length < 8) {
        return res
          .status(400)
          .json({ success: false, message: 'New password must be at least 8 characters' });
      }
      user.password = newPassword;
    }
    if (username !== undefined && username !== '') {
      const uname = String(username).toLowerCase().trim();
      const taken = await User.findOne({ username: uname, _id: { $ne: user._id } });
      if (taken) {
        return res.status(400).json({ success: false, message: 'That username is already taken' });
      }
      user.username = uname;
    }
    await user.save();
    await logAudit({
      req,
      user,
      action: 'CREDENTIALS_UPDATE',
      entityType: 'User',
      entityId: user._id,
    });
    res.json({ success: true, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};
