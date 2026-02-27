import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';

// Helper: set refresh token as HTTP-only cookie
const sendRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// @route  POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role, ...rest } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Build user object with role-specific profile
    const userData = { firstName, lastName, email, password, role };

    if (role === 'student') {
      userData.studentProfile = {
        university: rest.university || '',
        major: rest.major || '',
        gpa: rest.gpa || undefined,
        graduationYear: rest.graduationYear || undefined,
      };
    } else if (role === 'company') {
      if (!rest.companyName) {
        return res.status(400).json({ success: false, message: 'Company name is required' });
      }
      userData.companyProfile = {
        companyName: rest.companyName,
        industry: rest.industry || '',
        website: rest.website || '',
        companySize: rest.companySize || '',
      };
    } else if (role === 'university') {
      if (!rest.universityName) {
        return res.status(400).json({ success: false, message: 'University name is required' });
      }
      userData.universityProfile = {
        universityName: rest.universityName,
        country: rest.country || '',
        accreditationCode: rest.accreditationCode || '',
      };
    }

    const user = await User.create(userData);

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token on user
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Audit log
    await AuditLog.create({
      user: user._id,
      action: 'register',
      resource: 'User',
      resourceId: user._id,
      details: `New ${role} account created`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    sendRefreshCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @route  POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Optional role check — if provided, ensure it matches
    if (role && user.role !== role) {
      return res.status(401).json({
        success: false,
        message: `This account is registered as '${user.role}', not '${role}'`,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Audit log
    await AuditLog.create({
      user: user._id,
      action: 'login',
      resource: 'User',
      resourceId: user._id,
      details: `${user.role} logged in`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    sendRefreshCookie(res, refreshToken);

    res.json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
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

    // Rotate tokens
    const accessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    sendRefreshCookie(res, newRefreshToken);

    res.json({ success: true, accessToken });
  } catch (err) {
    next(err);
  }
};

// @route  POST /api/auth/logout
export const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      try {
        const decoded = verifyRefreshToken(token);
        await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
      } catch {
        // Token invalid — just clear the cookie
      }
    }

    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out' });
  } catch {
    // Even if token is invalid, clear the cookie
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out' });
  }
};

// @route  GET /api/auth/me
export const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};
