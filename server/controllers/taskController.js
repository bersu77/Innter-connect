import Task from '../models/Task.js';
import Placement from '../models/Placement.js';
import Student from '../models/Student.js';
import { logAudit } from '../services/audit.js';
import { notify } from '../services/notification.js';

// Supervisor tasks (PKG_05 / UC010, FR6).

// A task is overdue once the whole of its deadline day has elapsed. The student
// keeps the full deadline day; only the day after counts as late.
function deadlinePassed(task) {
  if (!task.deadline) return false;
  const cutoff = new Date(task.deadline);
  cutoff.setHours(23, 59, 59, 999);
  return Date.now() > cutoff.getTime();
}

// Lazily enforce the missed-deadline rule: a task not completed before its
// deadline is automatically scored 0. (No background job — infrastructure is
// deferred — so this is applied on read and on any write that touches a task.)
// Returns true if the task was changed and saved.
async function applyOverdue(task) {
  if (task.status === 'completed' || task.status === 'overdue') return false;
  if (!deadlinePassed(task)) return false;
  task.status = 'overdue';
  task.score = 0;
  task.autoZeroed = true;
  task.gradedAt = new Date();
  task.feedback = 'Automatically scored 0 — the deadline passed without a completed submission.';
  await task.save();
  return true;
}

// @route POST /api/tasks  (supervisor) — assign a task to one placement, or to
// every active intern at once (assignToAll). Each student's copy is numbered
// independently — TSK-0001 upward within that student's own task list — so the
// same task can be one student's 3rd and another's 10th.
export const createTask = async (req, res, next) => {
  try {
    const { title, description, deadline, maxScore } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Task title is required' });

    const truthy = (v) => v === true || v === 'true';
    const requiredDeliverables = {
      document: truthy(req.body.requireDocument),
      link: truthy(req.body.requireLink),
      note: truthy(req.body.requireNote),
    };

    // Resolve the target placement(s): one selected placement, or every active
    // intern the supervisor currently has.
    let placements;
    if (truthy(req.body.assignToAll)) {
      placements = await Placement.find({
        supervisorId: req.user._id,
        status: { $in: ['pending', 'active'] },
      }).populate('studentId', 'userId');
      if (!placements.length) {
        return res
          .status(400)
          .json({ success: false, message: 'You have no active interns to assign a task to' });
      }
    } else {
      if (!req.body.placementId) {
        return res.status(400).json({ success: false, message: 'Select a placement' });
      }
      const placement = await Placement.findById(req.body.placementId).populate(
        'studentId',
        'userId',
      );
      if (!placement) {
        return res.status(404).json({ success: false, message: 'Placement not found' });
      }
      if (String(placement.supervisorId) !== String(req.user._id)) {
        return res
          .status(403)
          .json({ success: false, message: 'You are not the supervisor for this placement' });
      }
      placements = [placement];
    }

    const maxScoreValue = maxScore === undefined || maxScore === '' ? 100 : Number(maxScore);
    const created = [];
    for (const placement of placements) {
      // Per-student sequence: the next number in this student's own task list.
      const last = await Task.findOne({ studentId: placement.studentId._id })
        .sort('-taskNumber')
        .select('taskNumber');
      const task = await Task.create({
        placementId: placement._id,
        studentId: placement.studentId._id,
        assignedBy: req.user._id,
        taskNumber: (last?.taskNumber || 0) + 1,
        title,
        description,
        deadline,
        maxScore: maxScoreValue,
        requiredDeliverables,
      });
      created.push(task);
      await logAudit({ req, action: 'TASK_ASSIGN', entityType: 'Task', entityId: task._id });
      if (placement.studentId?.userId) {
        await notify({
          userId: placement.studentId.userId,
          type: 'task',
          title: 'New task assigned',
          message: `${req.user.firstName} ${req.user.lastName} assigned you a new task: "${title}".`,
        });
      }
    }
    // `task` (the first) keeps single-assign callers working; `tasks` carries all.
    res.status(201).json({ success: true, task: created[0], tasks: created });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/tasks  — student sees own tasks; supervisor sees tasks they assigned.
export const listTasks = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.userType === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) return res.json({ success: true, tasks: [] });
      query.studentId = student._id;
    } else {
      // Placement-scoped: a supervisor sees every task on the placements they
      // currently supervise — including tasks a previous supervisor assigned.
      const placements = await Placement.find({ supervisorId: req.user._id }).select('_id');
      query.placementId = { $in: placements.map((p) => p._id) };
    }
    const tasks = await Task.find(query)
      .populate({ path: 'placementId', select: 'internshipId' })
      .populate({ path: 'studentId', select: 'userId', populate: { path: 'userId', select: 'firstName lastName' } })
      .populate({ path: 'assignedBy', select: 'firstName lastName' })
      .sort('-createdAt');
    // Enforce the missed-deadline rule on read: any task past its deadline is
    // auto-scored 0 before the list is returned.
    for (const task of tasks) await applyOverdue(task);
    res.json({ success: true, tasks });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/tasks/:id/progress  (student) — update task progress.
export const updateProgress = async (req, res, next) => {
  try {
    const { progressNote } = req.body;
    // updateProgress only starts a task; completion happens through submitTask.
    const student = await Student.findOne({ userId: req.user._id });
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (!student || String(task.studentId) !== String(student._id)) {
      return res.status(403).json({ success: false, message: 'This is not your task' });
    }
    if (task.status !== 'completed' && deadlinePassed(task)) {
      await applyOverdue(task);
      return res.status(400).json({
        success: false,
        message: 'The deadline for this task has passed — it can no longer be progressed.',
      });
    }

    if (task.status === 'assigned') task.status = 'in_progress';
    if (progressNote !== undefined) task.progressNote = progressNote;
    await task.save();

    await logAudit({
      req,
      action: 'TASK_PROGRESS_UPDATE',
      entityType: 'Task',
      entityId: task._id,
      metadata: { status: task.status },
    });
    if (task.assignedBy) {
      await notify({
        userId: task.assignedBy,
        type: 'task',
        title: 'Task progress updated',
        message: `A student started working on "${task.title}".`,
      });
    }
    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/tasks/:id/grade  (supervisor) — award a score and leave feedback.
export const gradeTask = async (req, res, next) => {
  try {
    const { score, feedback } = req.body;
    const task = await Task.findById(req.params.id).populate({
      path: 'studentId',
      select: 'userId',
    });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    // Grading authority follows the placement, not the original assigner — a
    // reassigned supervisor can grade tasks the previous supervisor created.
    const placement = await Placement.findById(task.placementId);
    if (!placement || String(placement.supervisorId) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ success: false, message: 'Only the placement supervisor can grade this task' });
    }
    if (score !== undefined && score !== '') {
      const numeric = Number(score);
      if (Number.isNaN(numeric) || numeric < 0 || numeric > task.maxScore) {
        return res
          .status(400)
          .json({ success: false, message: `Score must be between 0 and ${task.maxScore}` });
      }
      task.score = numeric;
    }
    if (feedback !== undefined) task.feedback = feedback;
    task.gradedAt = new Date();
    task.gradedBy = req.user._id;
    // A deliberate supervisor grade is no longer an automatic zero.
    task.autoZeroed = false;
    await task.save();

    await logAudit({ req, action: 'TASK_GRADE', entityType: 'Task', entityId: task._id });
    if (task.studentId?.userId) {
      await notify({
        userId: task.studentId.userId,
        type: 'task',
        title: 'Task graded',
        message: `Your supervisor graded "${task.title}"${
          task.score != null ? ` — ${task.score}/${task.maxScore}` : ''
        }.`,
      });
    }
    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/tasks/:id/submit  (student) — submit deliverables and complete the task.
// Required deliverables (set by the supervisor) must be present, or the submission is rejected.
export const submitTask = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (!student || String(task.studentId) !== String(student._id)) {
      return res.status(403).json({ success: false, message: 'This is not your task' });
    }
    // Missed-deadline rule: once the deadline passes the task is locked at 0 and
    // can no longer be submitted — the student's only recourse is a grade appeal.
    if (task.status !== 'completed' && deadlinePassed(task)) {
      await applyOverdue(task);
      return res.status(400).json({
        success: false,
        message:
          'The deadline for this task has passed — it can no longer be submitted. You may appeal the grade instead.',
      });
    }

    const required = task.requiredDeliverables || {};
    const existing = task.submission || {};
    const link = (req.body.link || '').trim();
    const note = (req.body.note || '').trim();
    const documentPath = req.file ? `/uploads/${req.file.filename}` : existing.documentPath;
    const documentName = req.file ? req.file.originalname : existing.documentName;

    const missing = [];
    if (required.document && !documentPath) missing.push('a document');
    if (required.link && !link) missing.push('a link');
    if (required.note && !note) missing.push('a note');
    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `This task requires ${missing.join(', ')} before it can be submitted.`,
      });
    }

    task.submission = {
      documentName,
      documentPath,
      link: link || existing.link,
      note: note || existing.note,
      submittedAt: new Date(),
    };
    task.status = 'completed';
    task.completedAt = new Date();
    await task.save();

    await logAudit({ req, action: 'TASK_SUBMIT', entityType: 'Task', entityId: task._id });
    if (task.assignedBy) {
      await notify({
        userId: task.assignedBy,
        type: 'task',
        title: 'Task submitted',
        message: `A student submitted "${task.title}" for review.`,
      });
    }
    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/tasks/:id/appeal  (student) — appeal the grade on a task.
// Applies equally to an automatic zero from a missed deadline.
export const submitGradeAppeal = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (!student || String(task.studentId) !== String(student._id)) {
      return res.status(403).json({ success: false, message: 'This is not your task' });
    }
    if (!task.gradedAt) {
      return res
        .status(400)
        .json({ success: false, message: 'You can only appeal a task that has been graded.' });
    }
    if (task.gradeAppeal?.submittedAt) {
      return res
        .status(400)
        .json({ success: false, message: 'This grade has already been appealed.' });
    }
    const reason = String(req.body.reason || '').trim();
    if (!reason) {
      return res
        .status(400)
        .json({ success: false, message: 'Please explain why you are appealing the grade.' });
    }

    task.gradeAppeal = { reason, status: 'pending', submittedAt: new Date() };
    await task.save();

    await logAudit({ req, action: 'TASK_GRADE_APPEAL', entityType: 'Task', entityId: task._id });
    const placement = await Placement.findById(task.placementId);
    if (placement?.supervisorId) {
      await notify({
        userId: placement.supervisorId,
        type: 'task',
        title: 'Grade appeal submitted',
        message: `A student appealed the grade on "${task.title}".`,
        relatedEntity: { type: 'Task', id: task._id },
      });
    }
    res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/tasks/:id/appeal  (supervisor) — resolve a grade appeal,
// either upholding the grade or adjusting the score.
export const resolveGradeAppeal = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate({
      path: 'studentId',
      select: 'userId',
    });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (!task.gradeAppeal?.submittedAt) {
      return res.status(400).json({ success: false, message: 'There is no appeal on this task.' });
    }
    if (task.gradeAppeal.status !== 'pending') {
      return res
        .status(400)
        .json({ success: false, message: 'This appeal has already been resolved.' });
    }
    // Grading authority follows the placement, not the original assigner.
    const placement = await Placement.findById(task.placementId);
    if (!placement || String(placement.supervisorId) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ success: false, message: 'Only the placement supervisor can resolve this appeal.' });
    }
    const response = String(req.body.response || '').trim();
    if (!response) {
      return res
        .status(400)
        .json({ success: false, message: 'Please provide a response to the appeal.' });
    }

    let adjusted = false;
    if (req.body.score !== undefined && req.body.score !== '') {
      const numeric = Number(req.body.score);
      if (Number.isNaN(numeric) || numeric < 0 || numeric > task.maxScore) {
        return res
          .status(400)
          .json({ success: false, message: `Score must be between 0 and ${task.maxScore}` });
      }
      if (numeric !== task.score) {
        task.score = numeric;
        adjusted = true;
      }
    }
    if (req.body.feedback !== undefined) task.feedback = req.body.feedback;
    if (adjusted) {
      // A human re-grade supersedes any automatic zero.
      task.autoZeroed = false;
      task.gradedAt = new Date();
      task.gradedBy = req.user._id;
    }
    task.gradeAppeal.status = adjusted ? 'adjusted' : 'upheld';
    task.gradeAppeal.response = response;
    task.gradeAppeal.resolvedBy = req.user._id;
    task.gradeAppeal.resolvedAt = new Date();
    await task.save();

    await logAudit({
      req,
      action: 'TASK_GRADE_APPEAL_RESOLVE',
      entityType: 'Task',
      entityId: task._id,
      metadata: { outcome: task.gradeAppeal.status },
    });
    if (task.studentId?.userId) {
      await notify({
        userId: task.studentId.userId,
        type: 'task',
        title: 'Grade appeal resolved',
        message: `Your appeal on "${task.title}" was ${
          adjusted ? 'accepted — your grade was updated' : 'reviewed — the original grade stands'
        }.`,
        relatedEntity: { type: 'Task', id: task._id },
      });
    }
    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};
