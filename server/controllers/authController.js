import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';

// Phase 1 note: adapted to the new User/AuditLog schemas. Phase 2 rebuilds this
// with full RBAC, account lockout, and session hardening.

const sendRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const publicUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  userType: user.userType,
  roles: user.roles,
  status: user.status,
  verificationStatus: user.verificationStatus,
  profileComplete: user.profileComplete,
});

// @route  POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const userType = req.body.userType || req.body.role;

    if (!userType) {
      return res.status(400).json({ success: false, message: 'User type is required' });
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

    await AuditLog.create({
      userId: user._id,
      userType: user.userType,
      action: 'register',
      entityType: 'User',
      entityId: user._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'success',
    });

    sendRefreshCookie(res, refreshToken);
    res.status(201).json({ success: true, token: accessToken, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

// @route  POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    await AuditLog.create({
      userId: user._id,
      userType: user.userType,
      action: 'login',
      entityType: 'User',
      entityId: user._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'success',
    });

    sendRefreshCookie(res, refreshToken);
    res.json({ success: true, token: accessToken, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

// @route  POST /api/auth/refresh
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

// @route  POST /api/auth/logout
export const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      try {
        const decoded = verifyRefreshToken(token);
        await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
      } catch {
        // Token invalid — clearing the cookie below is enough.
      }
    }
  } catch {
    // Logout must always succeed for the client.
  }
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out' });
};

// @route  GET /api/auth/me
export const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};
