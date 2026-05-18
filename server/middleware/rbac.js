import { effectivePermissions } from '../config/permissions.js';

// RBAC Engine (PDF §3.3.4.1) — permission- and role-based authorization.
// Use after `protect`, which populates req.user.

// Require every listed permission.
export const requirePermission = (...required) => (req, res, next) => {
  const perms = effectivePermissions(req.user);
  if (required.every((p) => perms.has(p))) return next();
  return res
    .status(403)
    .json({ success: false, message: 'You do not have permission to perform this action' });
};

// Require at least one of the listed permissions.
export const requireAnyPermission = (...options) => (req, res, next) => {
  const perms = effectivePermissions(req.user);
  if (options.some((p) => perms.has(p))) return next();
  return res
    .status(403)
    .json({ success: false, message: 'You do not have permission to perform this action' });
};

// Require at least one of the listed sub-roles (e.g. supervisor, auditor).
export const requireRole = (...roles) => (req, res, next) => {
  if ((req.user.roles || []).some((r) => roles.includes(r))) return next();
  return res
    .status(403)
    .json({ success: false, message: `This action requires the ${roles.join(' or ')} role` });
};
