import AuditLog from '../models/AuditLog.js';

// Audit & Compliance (PKG_08 / UC014, FR14).

// @route GET /api/audit/logs  — filterable audit-trail review.
export const listAuditLogs = async (req, res, next) => {
  try {
    const { action, entityType, status, userType, limit } = req.query;
    const query = {};
    if (action) query.action = new RegExp(action, 'i');
    if (entityType) query.entityType = entityType;
    if (status) query.status = status;
    if (userType) query.userType = userType;

    const logs = await AuditLog.find(query)
      .populate('userId', 'firstName lastName email')
      .sort('-createdAt')
      .limit(Math.min(Number(limit) || 200, 500));
    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/audit/stats  — system-monitoring summary (FR14).
export const auditStats = async (req, res, next) => {
  try {
    const [total, failures, topActions] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.countDocuments({ status: 'failure' }),
      AuditLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
    ]);
    res.json({
      success: true,
      stats: { total, failures, success: total - failures },
      topActions: topActions.map((a) => ({ action: a._id, count: a.count })),
    });
  } catch (err) {
    next(err);
  }
};
