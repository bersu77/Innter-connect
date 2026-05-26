import { verifyAccessToken } from '../utils/jwt.js';
import User from '../models/User.js';

// Protect routes — requires a valid Bearer access token.
export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorized — no token' });
    }

    const token = header.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }
    if (user.status === 'suspended' || user.status === 'deleted') {
      return res.status(403).json({ success: false, message: 'Account is not active' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Not authorized — token invalid' });
  }
};

// Soft protect — decode the token IF present and attach req.user, but never
// reject for missing/invalid tokens. Lets a route serve both anonymous and
// authenticated callers from the same handler (e.g. public internship browse:
// anyone can read; the controller chooses what to return per-user).
export const softProtect = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return next();
    const token = header.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('-password');
    if (user && user.status !== 'suspended' && user.status !== 'deleted') {
      req.user = user;
    }
  } catch {
    /* invalid token — anonymous request */
  }
  next();
};

// Restrict a route to specific userTypes.
export const authorize = (...userTypes) => (req, res, next) => {
  if (!userTypes.includes(req.user.userType)) {
    return res.status(403).json({
      success: false,
      message: `User type '${req.user.userType}' is not authorized for this route`,
    });
  }
  next();
};
