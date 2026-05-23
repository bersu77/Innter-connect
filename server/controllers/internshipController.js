import Internship from '../models/Internship.js';
import Company from '../models/Company.js';
import { logAudit } from '../services/audit.js';

// Internship Management (PKG_04 / UC005, UC015, FR3).
const EDITABLE = [
  'title',
  'description',
  'locations',
  'requirements',
  'position',
  'applicationDeadline',
  'totalPositions',
  'tags',
];

// @route POST /api/internships  (company)
export const createInternship = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    if (!company) {
      return res
        .status(400)
        .json({ success: false, message: 'Create your company profile before posting internships' });
    }
    if (!company.verified) {
      return res
        .status(403)
        .json({ success: false, message: 'Your company must be verified before posting internships' });
    }
    const data = {};
    for (const field of EDITABLE) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }
    const publish = req.body.status === 'active';
    const internship = await Internship.create({
      ...data,
      companyId: company._id,
      createdBy: req.user._id,
      status: publish ? 'active' : 'draft',
      postedDate: publish ? new Date() : undefined,
    });
    await logAudit({
      req,
      action: 'INTERNSHIP_CREATE',
      entityType: 'Internship',
      entityId: internship._id,
    });
    res.status(201).json({ success: true, internship });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/internships  — browse active internships with filters (UC015).
export const listInternships = async (req, res, next) => {
  try {
    const { search, location, type } = req.query;
    const query = { status: 'active' };
    if (location) query.locations = new RegExp(location, 'i');
    if (type) query['position.type'] = type;
    if (search) query.$text = { $search: search };

    const internships = await Internship.find(query)
      .populate('companyId', 'name city industry logo verified')
      .sort('-postedDate')
      .limit(100);
    res.json({ success: true, internships });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/internships/mine  (company) — own postings.
export const listMyInternships = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    if (!company) return res.json({ success: true, internships: [] });
    const internships = await Internship.find({ companyId: company._id }).sort('-createdAt');
    res.json({ success: true, internships });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/internships/:id  — detail (increments viewCount).
export const getInternship = async (req, res, next) => {
  try {
    const internship = await Internship.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true },
    ).populate('companyId', 'name city country industry logo verified website description');
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }
    res.json({ success: true, internship });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/internships/:id  (company) — edit own.
export const updateInternship = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    const internship = await Internship.findById(req.params.id);
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }
    if (!company || String(internship.companyId) !== String(company._id)) {
      return res.status(403).json({ success: false, message: 'This is not your internship' });
    }
    for (const field of EDITABLE) {
      if (req.body[field] !== undefined) internship[field] = req.body[field];
    }
    internship.updatedBy = req.user._id;
    await internship.save();
    await logAudit({
      req,
      action: 'INTERNSHIP_UPDATE',
      entityType: 'Internship',
      entityId: internship._id,
    });
    res.json({ success: true, internship });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/internships/:id/status  (company) — publish / close / archive.
export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['draft', 'active', 'closed', 'archived'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const company = await Company.findOne({ userId: req.user._id });
    const internship = await Internship.findById(req.params.id);
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }
    if (!company || String(internship.companyId) !== String(company._id)) {
      return res.status(403).json({ success: false, message: 'This is not your internship' });
    }
    internship.status = status;
    if (status === 'active' && !internship.postedDate) internship.postedDate = new Date();
    if (status === 'closed') internship.closedDate = new Date();
    await internship.save();
    await logAudit({
      req,
      action: 'INTERNSHIP_STATUS_CHANGE',
      entityType: 'Internship',
      entityId: internship._id,
      metadata: { status },
    });
    res.json({ success: true, internship });
  } catch (err) {
    next(err);
  }
};
