import { Verification, VerificationAppeal } from '../models/Verification.js';
import { logAudit } from '../services/audit.js';

// Verification appeals workflow (PDF §3.3.5.2.8).

// @route POST /api/verifications/:verificationId/appeal
export const submitAppeal = async (req, res, next) => {
  try {
    const verification = await Verification.findById(req.params.verificationId);
    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification record not found' });
    }
    if (verification.status !== 'rejected') {
      return res
        .status(400)
        .json({ success: false, message: 'Only rejected verifications can be appealed' });
    }
    const appeal = await VerificationAppeal.create({
      verificationId: verification._id,
      submittedBy: req.user._id,
      reason: req.body.reason,
    });
    await logAudit({
      req,
      action: 'VERIFICATION_APPEAL_SUBMIT',
      entityType: 'VerificationAppeal',
      entityId: appeal._id,
    });
    res.status(201).json({ success: true, appeal });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/verifications/appeals  (admin)
export const listAppeals = async (_req, res, next) => {
  try {
    const appeals = await VerificationAppeal.find()
      .populate('submittedBy', 'firstName lastName email')
      .populate('verificationId')
      .sort('-createdAt');
    res.json({ success: true, appeals });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/verifications/appeals/:id  (admin)
export const decideAppeal = async (req, res, next) => {
  try {
    const { decision } = req.body;
    if (!['upheld', 'overturned'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Invalid decision' });
    }
    const appeal = await VerificationAppeal.findById(req.params.id);
    if (!appeal) return res.status(404).json({ success: false, message: 'Appeal not found' });

    appeal.status = decision;
    appeal.decidedBy = req.user._id;
    appeal.decidedAt = new Date();
    await appeal.save();

    await logAudit({
      req,
      action: 'VERIFICATION_APPEAL_DECIDE',
      entityType: 'VerificationAppeal',
      entityId: appeal._id,
      metadata: { decision },
    });
    res.json({ success: true, appeal });
  } catch (err) {
    next(err);
  }
};
