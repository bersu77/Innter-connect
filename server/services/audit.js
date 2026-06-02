import AuditLog from '../models/AuditLog.js';

// Audit service (PKG_08 / PDF §3.3.4.8) — writes immutable audit-trail entries.
// Never throws into the request path: a failed audit write must not break the action.
export async function logAudit({
  req,
  user,
  action,
  entityType,
  entityId,
  status = 'success',
  changes,
  errorMessage,
  metadata,
}) {
  try {
    const actor = user || req?.user;
    await AuditLog.create({
      userId: actor?._id,
      userType: actor?.userType,
      action,
      entityType,
      entityId,
      changes,
      status,
      errorMessage,
      metadata,
      ipAddress: req?.ip,
      userAgent: req?.get?.('User-Agent'),
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}
