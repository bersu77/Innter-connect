import User from '../models/User.js';
import Student from '../models/Student.js';
import Company from '../models/Company.js';
import University from '../models/University.js';
import Internship from '../models/Internship.js';
import Application from '../models/Application.js';
import { Verification } from '../models/Verification.js';
import { logAudit } from '../services/audit.js';
import { notify } from '../services/notification.js';

// Admin / System Administration (UC012, FR13).

// @route GET /api/admin/users
export const listUsers = async (req, res, next) => {
  try {
    const { userType, status, search } = req.query;
    const query = {};
    if (userType) query.userType = userType;
    if (status) query.status = status;
    if (search) {
      const rx = new RegExp(search, 'i');
      query.$or = [{ email: rx }, { firstName: rx }, { lastName: rx }];
    }
    const users = await User.find(query).select('-refreshToken').sort('-createdAt').limit(200);
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/admin/users/:id/status
export const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended', 'deleted'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.userType === 'admin') {
      return res.status(403).json({ success: false, message: 'Administrator accounts cannot be modified' });
    }
    const before = user.status;
    user.status = status;
    if (status === 'deleted') user.deletedAt = new Date();
    await user.save({ validateBeforeSave: false });

    await logAudit({
      req,
      action: 'USER_STATUS_CHANGE',
      entityType: 'User',
      entityId: user._id,
      changes: { before: { status: before }, after: { status } },
    });
    await notify({
      userId: user._id,
      type: 'account',
      title: 'Account status updated',
      message: `Your account status is now "${status}".`,
    });
    res.json({ success: true, user: { id: user._id, status: user.status } });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/admin/stats
export const getStats = async (req, res, next) => {
  try {
    const [users, students, companies, universities, internships, applications, pendingCompanies, pendingUniversities] =
      await Promise.all([
        User.countDocuments(),
        Student.countDocuments(),
        Company.countDocuments(),
        University.countDocuments(),
        Internship.countDocuments(),
        Application.countDocuments(),
        Company.countDocuments({ verified: false }),
        University.countDocuments({ verified: false }),
      ]);
    res.json({
      success: true,
      stats: {
        users,
        students,
        companies,
        universities,
        internships,
        applications,
        pendingOrganizations: pendingCompanies + pendingUniversities,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/admin/organizations
export const listOrganizations = async (_req, res, next) => {
  try {
    const [companies, universities] = await Promise.all([
      Company.find().populate('userId', 'firstName lastName email').sort('-createdAt'),
      University.find().populate('userId', 'firstName lastName email').sort('-createdAt'),
    ]);
    res.json({ success: true, companies, universities });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/admin/organizations/:type/:id/verify
export const verifyOrganization = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const { decision, remarks } = req.body;
    if (!['company', 'university'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid entity type' });
    }
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Invalid decision' });
    }
    const Model = type === 'company' ? Company : University;
    const entity = await Model.findById(id);
    if (!entity) return res.status(404).json({ success: false, message: 'Organization not found' });

    entity.verified = decision === 'approved';
    entity.verificationDate = new Date();
    entity.verifiedBy = req.user._id;
    await entity.save();

    await Verification.create({
      entityType: type,
      entityId: entity._id,
      requestedBy: entity.userId,
      reviewedBy: req.user._id,
      status: decision,
      remarks,
      reviewedAt: new Date(),
    });
    if (entity.userId) {
      await User.findByIdAndUpdate(entity.userId, {
        verificationStatus: decision === 'approved' ? 'verified' : 'rejected',
      });
      await notify({
        userId: entity.userId,
        type: 'verification',
        title: `Organization verification ${decision}`,
        message:
          decision === 'approved'
            ? `Your ${type} has been verified. You can now use all platform features.`
            : `Your ${type} verification was rejected. ${remarks || ''}`,
      });
    }
    await logAudit({
      req,
      action: 'ORGANIZATION_VERIFY',
      entityType: type,
      entityId: entity._id,
      metadata: { decision },
    });
    res.json({ success: true, entity });
  } catch (err) {
    next(err);
  }
};
