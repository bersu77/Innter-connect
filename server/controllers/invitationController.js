import Invitation from '../models/Invitation.js';
import University from '../models/University.js';
import Company from '../models/Company.js';
import { logAudit } from '../services/audit.js';
import { notify } from '../services/notification.js';

// University–company invitations (UC006, FR11).

// @route POST /api/invitations  (university)
export const sendInvitation = async (req, res, next) => {
  try {
    const university = await University.findOne({ userId: req.user._id });
    if (!university) {
      return res
        .status(400)
        .json({ success: false, message: 'Create your university profile first' });
    }
    const company = await Company.findById(req.body.companyId);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    const existing = await Invitation.findOne({
      universityId: university._id,
      companyId: company._id,
      status: 'sent',
    });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: 'You already have a pending invitation to this company' });
    }

    const invitation = await Invitation.create({
      universityId: university._id,
      companyId: company._id,
      sentBy: req.user._id,
      message: req.body.message,
    });
    if (company.userId) {
      await notify({
        userId: company.userId,
        type: 'invitation',
        title: 'Partnership invitation',
        message: `${university.name} has invited your company to partner for internships.`,
      });
    }
    await logAudit({
      req,
      action: 'INVITATION_SEND',
      entityType: 'Invitation',
      entityId: invitation._id,
    });
    res.status(201).json({ success: true, invitation });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/invitations  — university sees sent, company sees received.
export const listInvitations = async (req, res, next) => {
  try {
    let invitations = [];
    if (req.user.userType === 'university') {
      const university = await University.findOne({ userId: req.user._id });
      if (university) {
        invitations = await Invitation.find({ universityId: university._id })
          .populate('companyId', 'name city industry')
          .sort('-createdAt');
      }
    } else if (req.user.userType === 'company') {
      const company = await Company.findOne({ userId: req.user._id });
      if (company) {
        invitations = await Invitation.find({ companyId: company._id })
          .populate('universityId', 'name city')
          .sort('-createdAt');
      }
    }
    res.json({ success: true, invitations });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/invitations/:id/respond  (company)
export const respondInvitation = async (req, res, next) => {
  try {
    const { decision } = req.body;
    if (!['accepted', 'declined'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Invalid decision' });
    }
    const company = await Company.findOne({ userId: req.user._id });
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }
    if (!company || String(invitation.companyId) !== String(company._id)) {
      return res.status(403).json({ success: false, message: 'This invitation is not addressed to you' });
    }
    invitation.status = decision;
    invitation.respondedAt = new Date();
    await invitation.save();
    await logAudit({
      req,
      action: 'INVITATION_RESPOND',
      entityType: 'Invitation',
      entityId: invitation._id,
      metadata: { decision },
    });
    res.json({ success: true, invitation });
  } catch (err) {
    next(err);
  }
};
