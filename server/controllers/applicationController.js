import Application from '../models/Application.js';
import Internship from '../models/Internship.js';
import Student from '../models/Student.js';
import Company from '../models/Company.js';
import University from '../models/University.js';
import Placement from '../models/Placement.js';
import { logAudit } from '../services/audit.js';
import { notify } from '../services/notification.js';

// Application & Selection (PKG_05 / UC003, UC004, UC007, UC008, UC016, UC017).

// @route POST /api/applications  (student) — apply to an internship.
export const applyToInternship = async (req, res, next) => {
  try {
    const { internshipId, coverLetter } = req.body;
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res
        .status(400)
        .json({ success: false, message: 'Complete your student profile before applying' });
    }
    // A CV is required to apply — companies must have at least the résumé to
    // evaluate a candidate. Enforced on the server so the rule holds even if
    // the client is bypassed.
    if (!student.cv?.path) {
      return res.status(400).json({
        success: false,
        message: 'Upload your CV on your profile page before applying to internships',
      });
    }
    // The student specifies which university they are enrolled at (the apply
    // form pre-fills it from their profile). That university verifies them
    // before the company may act on the application.
    const universityId = req.body.universityId || student.universityId;
    if (!universityId) {
      return res
        .status(400)
        .json({ success: false, message: 'Select the university you are enrolled at' });
    }
    const university = await University.findById(universityId);
    if (!university) {
      return res.status(404).json({ success: false, message: 'University not found' });
    }
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }
    if (internship.status !== 'active') {
      return res
        .status(400)
        .json({ success: false, message: 'This internship is not accepting applications' });
    }
    const existing = await Application.findOne({ studentId: student._id, internshipId });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: 'You have already applied to this internship' });
    }

    // Attachments: snapshots of the profile items the student chose to include,
    // plus any files uploaded manually with the application. Profile items are
    // snapshotted server-side from the real profile, not trusted from the client.
    let selected = req.body.selectedItems || [];
    if (typeof selected === 'string') {
      try {
        selected = JSON.parse(selected);
      } catch {
        selected = [];
      }
    }
    if (!Array.isArray(selected)) selected = [];
    const attachments = [];
    for (const sel of selected) {
      if (sel?.kind === 'cv' && student.cv?.path) {
        attachments.push({
          kind: 'cv',
          label: student.cv.filename || 'CV / Résumé',
          path: student.cv.path,
          link: student.cv.path,
        });
      } else if (sel?.kind === 'certification' && student.certifications?.[sel.index]) {
        const c = student.certifications[sel.index];
        attachments.push({ kind: 'certification', label: c.name, detail: c.issuer, link: c.credentialUrl });
      } else if (sel?.kind === 'experience' && student.experience?.[sel.index]) {
        const e = student.experience[sel.index];
        attachments.push({
          kind: 'experience',
          label: e.role,
          detail: [e.organization, [e.startDate, e.endDate].filter(Boolean).join(' – ')]
            .filter(Boolean)
            .join(' · '),
        });
      } else if (sel?.kind === 'portfolio' && student.portfolio?.[sel.index]) {
        const p = student.portfolio[sel.index];
        attachments.push({
          kind: 'portfolio',
          label: p.title,
          detail: p.description,
          link: p.link || p.path,
          filename: p.filename,
        });
      } else if (sel?.kind === 'document' && student.academicDocuments?.[sel.index]) {
        const d = student.academicDocuments[sel.index];
        attachments.push({
          kind: 'document',
          label: d.name || d.filename || 'Academic document',
          detail: d.category || 'other',
          link: d.path,
          path: d.path,
          filename: d.filename,
        });
      }
    }
    for (const f of req.files || []) {
      attachments.push({
        kind: 'upload',
        label: f.originalname,
        filename: f.originalname,
        path: `/uploads/${f.filename}`,
      });
    }

    const application = await Application.create({
      studentId: student._id,
      internshipId,
      companyId: internship.companyId,
      universityId,
      universityVerification: { status: 'pending' },
      coverLetter,
      attachments,
      status: 'submitted',
      submittedAt: new Date(),
      statusHistory: [{ status: 'submitted', changedBy: req.user._id }],
    });
    await Internship.findByIdAndUpdate(internshipId, {
      $addToSet: { applications: application._id },
    });
    await logAudit({
      req,
      action: 'APPLICATION_SUBMIT',
      entityType: 'Application',
      entityId: application._id,
    });

    // Notify the university — they must verify the applicant first.
    if (university.userId) {
      await notify({
        userId: university.userId,
        type: 'application',
        title: 'Applicant needs verification',
        message: `A student from your university applied to "${internship.title}" — please verify their enrolment and documents.`,
        relatedEntity: { type: 'Application', id: application._id },
      });
    }
    const company = await Company.findById(internship.companyId);
    if (company?.userId) {
      await notify({
        userId: company.userId,
        type: 'application',
        title: 'New application received',
        message: `A student applied to your "${internship.title}" internship — pending university verification.`,
        relatedEntity: { type: 'Application', id: application._id },
      });
    }
    res.status(201).json({ success: true, application });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: 'You have already applied to this internship' });
    }
    next(err);
  }
};

// @route GET /api/applications  — student sees own; company sees applications to its internships.
export const listApplications = async (req, res, next) => {
  try {
    if (req.user.userType === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) return res.json({ success: true, applications: [] });
      const applications = await Application.find({ studentId: student._id })
        .populate({
          path: 'internshipId',
          select: 'title status companyId',
          populate: { path: 'companyId', select: 'name' },
        })
        .sort('-submittedAt');
      return res.json({ success: true, applications });
    }
    if (req.user.userType === 'company') {
      const company = await Company.findOne({ userId: req.user._id });
      if (!company) return res.json({ success: true, applications: [] });
      const query = { companyId: company._id };
      if (req.query.internshipId) query.internshipId = req.query.internshipId;
      if (req.query.status) query.status = req.query.status;
      const applications = await Application.find(query)
        .populate('internshipId', 'title')
        .populate({
          path: 'studentId',
          select: 'major gpa userId',
          populate: { path: 'userId', select: 'firstName lastName email' },
        })
        .sort('-submittedAt');
      return res.json({ success: true, applications });
    }
    if (req.user.userType === 'university') {
      const university = await University.findOne({ userId: req.user._id });
      if (!university) return res.json({ success: true, applications: [] });
      // The verifier sees the FULL student profile (no `select` narrowing) —
      // the page renders an expandable "Student profile" panel with every
      // field the student filled in: major, GPA, skills, interests, languages,
      // certifications, experience, portfolio, CV. This is the same data the
      // student themselves see on /dashboard/profile.
      const applications = await Application.find({ universityId: university._id })
        .populate('internshipId', 'title')
        .populate('companyId', 'name')
        .populate({
          path: 'studentId',
          populate: { path: 'userId', select: 'firstName lastName email username' },
        })
        .sort('-submittedAt');
      return res.json({ success: true, applications });
    }
    res.json({ success: true, applications: [] });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/applications/:id
export const getApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate({
        path: 'internshipId',
        select: 'title description companyId',
        populate: { path: 'companyId', select: 'name' },
      })
      .populate({
        path: 'studentId',
        select: 'major gpa skills cv userId',
        populate: { path: 'userId', select: 'firstName lastName email' },
      });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    // Ownership check: only the applicant, the company, or the university can view.
    let allowed = false;
    if (req.user.userType === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      allowed = student && String(application.studentId?._id || application.studentId) === String(student._id);
    } else if (req.user.userType === 'company') {
      const company = await Company.findOne({ userId: req.user._id });
      allowed = company && String(application.companyId) === String(company._id);
    } else if (req.user.userType === 'university') {
      const university = await University.findOne({ userId: req.user._id });
      allowed = university && String(application.universityId) === String(university._id);
    } else if (req.user.userType === 'admin') {
      allowed = true;
    }
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'You do not have access to this application' });
    }
    res.json({ success: true, application });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/applications/:id/status  (company) — review / shortlist / offer / reject.
export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const allowed = ['under_review', 'shortlisted', 'offered', 'rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const company = await Company.findOne({ userId: req.user._id });
    const application = await Application.findById(req.params.id).populate('internshipId', 'title');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    if (!company || String(application.companyId) !== String(company._id)) {
      return res.status(403).json({ success: false, message: 'This is not your application to review' });
    }
    // Gate: the company can only act once the university has verified the student.
    if (application.universityVerification?.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message:
          'This application is awaiting university verification of the student — you cannot act on it yet.',
      });
    }

    application.status = status;
    application.reviewedAt = new Date();
    application.reviewedBy = req.user._id;
    if (status === 'shortlisted') application.shortlistedAt = new Date();
    if (status === 'rejected') {
      application.rejectionReason = note;
      application.rejectionDate = new Date();
    }
    application.statusHistory.push({ status, changedBy: req.user._id, note });
    await application.save();

    await logAudit({
      req,
      action: 'APPLICATION_STATUS_CHANGE',
      entityType: 'Application',
      entityId: application._id,
      metadata: { status },
    });

    const student = await Student.findById(application.studentId);
    if (student?.userId) {
      await notify({
        userId: student.userId,
        type: 'application',
        title: `Application ${status.replace('_', ' ')}`,
        message: `Your application for "${application.internshipId?.title}" is now ${status.replace('_', ' ')}.`,
        relatedEntity: { type: 'Application', id: application._id },
      });
    }
    res.json({ success: true, application });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/applications/:id/withdraw  (student, UC016) — withdraw before review.
export const withdrawApplication = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    if (!student || String(application.studentId) !== String(student._id)) {
      return res.status(403).json({ success: false, message: 'This is not your application' });
    }
    // Business rule (PDF UC016): withdrawal only allowed before review.
    if (application.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Applications can only be withdrawn before they are reviewed',
      });
    }
    application.status = 'withdrawn';
    application.statusHistory.push({ status: 'withdrawn', changedBy: req.user._id });
    await application.save();
    await logAudit({
      req,
      action: 'APPLICATION_WITHDRAW',
      entityType: 'Application',
      entityId: application._id,
    });
    res.json({ success: true, application });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/applications/:id/respond-offer  (student, UC017) — accept / reject an offer.
export const respondToOffer = async (req, res, next) => {
  try {
    const { decision } = req.body;
    if (!['accept', 'reject'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Invalid decision' });
    }
    const student = await Student.findOne({ userId: req.user._id });
    const application = await Application.findById(req.params.id).populate('internshipId', 'title');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    if (!student || String(application.studentId) !== String(student._id)) {
      return res.status(403).json({ success: false, message: 'This is not your application' });
    }
    // Business rule (PDF UC017): one response per offer, decision is final.
    if (application.status !== 'offered') {
      return res.status(400).json({ success: false, message: 'There is no active offer to respond to' });
    }

    if (decision === 'reject') {
      application.status = 'rejected';
      application.statusHistory.push({
        status: 'rejected',
        changedBy: req.user._id,
        note: 'Offer declined by student',
      });
      await application.save();
      await logAudit({
        req,
        action: 'OFFER_DECLINE',
        entityType: 'Application',
        entityId: application._id,
      });
      return res.json({ success: true, application });
    }

    // Accept — create a Placement.
    application.status = 'accepted';
    application.statusHistory.push({
      status: 'accepted',
      changedBy: req.user._id,
      note: 'Offer accepted by student',
    });
    await application.save();

    let placement = await Placement.findOne({ applicationId: application._id });
    if (!placement) {
      placement = await Placement.create({
        applicationId: application._id,
        studentId: application.studentId,
        internshipId: application.internshipId._id,
        companyId: application.companyId,
        universityId: application.universityId,
        status: 'pending',
        confirmedAt: new Date(),
        confirmedBy: req.user._id,
      });
      await Internship.findByIdAndUpdate(application.internshipId._id, {
        $inc: { filledPositions: 1 },
      });
    }
    await logAudit({
      req,
      action: 'OFFER_ACCEPT',
      entityType: 'Placement',
      entityId: placement._id,
    });
    const company = await Company.findById(application.companyId);
    if (company?.userId) {
      await notify({
        userId: company.userId,
        type: 'placement',
        title: 'Offer accepted',
        message: `A student accepted your offer for "${application.internshipId?.title}".`,
      });
    }
    res.json({ success: true, application, placement });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/applications/:id/withdraw-offer  (company, UC017) — revoke an offer.
export const withdrawOffer = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    const application = await Application.findById(req.params.id).populate('internshipId', 'title');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    if (!company || String(application.companyId) !== String(company._id)) {
      return res.status(403).json({ success: false, message: 'This is not your application' });
    }
    if (application.status !== 'offered') {
      return res.status(400).json({ success: false, message: 'There is no active offer to withdraw' });
    }
    application.status = 'under_review';
    application.statusHistory.push({
      status: 'under_review',
      changedBy: req.user._id,
      note: 'Offer withdrawn by company',
    });
    await application.save();
    await logAudit({
      req,
      action: 'OFFER_WITHDRAW',
      entityType: 'Application',
      entityId: application._id,
    });
    const student = await Student.findById(application.studentId);
    if (student?.userId) {
      await notify({
        userId: student.userId,
        type: 'application',
        title: 'Offer withdrawn',
        message: `The company withdrew its offer for "${application.internshipId?.title}".`,
        relatedEntity: { type: 'Application', id: application._id },
      });
    }
    res.json({ success: true, application });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/applications/:id/verify  (university) — verify the student
// behind an application. The company cannot act on it until this is approved;
// a rejection closes the application.
export const verifyApplication = async (req, res, next) => {
  try {
    const { decision, note } = req.body;
    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Invalid decision' });
    }
    const university = await University.findOne({ userId: req.user._id });
    if (!university) {
      return res
        .status(400)
        .json({ success: false, message: 'Create your university profile first' });
    }
    const application = await Application.findById(req.params.id)
      .populate('internshipId', 'title')
      .populate('studentId', 'userId');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    if (String(application.universityId) !== String(university._id)) {
      return res
        .status(403)
        .json({ success: false, message: 'This applicant is not from your university' });
    }
    if (application.universityVerification?.status !== 'pending') {
      return res
        .status(400)
        .json({ success: false, message: 'This application has already been verified' });
    }

    const now = new Date();
    application.universityVerification = {
      status: decision === 'approve' ? 'approved' : 'rejected',
      reviewedBy: req.user._id,
      reviewedAt: now,
      note,
    };
    // A failed verification closes the application outright.
    if (decision === 'reject') {
      application.status = 'rejected';
      application.rejectionReason = note || 'The university could not verify this student.';
      application.rejectionDate = now;
      application.statusHistory.push({
        status: 'rejected',
        changedBy: req.user._id,
        note: note || 'University verification failed',
      });
    }
    await application.save();

    await logAudit({
      req,
      action: 'APPLICATION_VERIFY',
      entityType: 'Application',
      entityId: application._id,
      metadata: { decision },
    });

    const approved = decision === 'approve';
    const company = await Company.findById(application.companyId);
    if (company?.userId) {
      await notify({
        userId: company.userId,
        type: 'application',
        title: approved ? 'Applicant verified by university' : 'Applicant could not be verified',
        message: approved
          ? `${university.name} verified an applicant for "${application.internshipId?.title}" — you can now review the application.`
          : `${university.name} could not verify an applicant for "${application.internshipId?.title}" — the application was closed.`,
        relatedEntity: { type: 'Application', id: application._id },
      });
    }
    if (application.studentId?.userId) {
      await notify({
        userId: application.studentId.userId,
        type: 'application',
        title: approved ? 'Your application was verified' : 'Your application could not be verified',
        message: `${university.name} ${
          approved ? 'verified' : 'could not verify'
        } your application for "${application.internshipId?.title}".`,
        relatedEntity: { type: 'Application', id: application._id },
      });
    }
    res.json({ success: true, application });
  } catch (err) {
    next(err);
  }
};
