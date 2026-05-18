import Task from '../models/Task.js';
import Placement from '../models/Placement.js';
import Student from '../models/Student.js';
import { logAudit } from '../services/audit.js';
import { notify } from '../services/notification.js';

// Supervisor tasks (PKG_05 / UC010, FR6).

// @route POST /api/tasks  (supervisor) — assign a task to a placement.
export const createTask = async (req, res, next) => {
  try {
    const { placementId, title, description, deadline, maxScore } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Task title is required' });

    const placement = await Placement.findById(placementId).populate('studentId', 'userId');
    if (!placement) {
      return res.status(404).json({ success: false, message: 'Placement not found' });
    }
    if (String(placement.supervisorId) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ success: false, message: 'You are not the supervisor for this placement' });
    }

    const task = await Task.create({
      placementId,
      studentId: placement.studentId._id,
      assignedBy: req.user._id,
      title,
      description,
      deadline,
      maxScore: maxScore === undefined || maxScore === '' ? 100 : Number(maxScore),
    });
    await logAudit({ req, action: 'TASK_ASSIGN', entityType: 'Task', entityId: task._id });
    if (placement.studentId?.userId) {
      await notify({
        userId: placement.studentId.userId,
        type: 'task',
        title: 'New task assigned',
        message: `Your supervisor assigned a new task: "${title}".`,
      });
    }
    res.status(201).json({ success: true, task });
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
      query.assignedBy = req.user._id;
    }
    const tasks = await Task.find(query)
      .populate({ path: 'placementId', select: 'internshipId' })
      .populate({ path: 'studentId', select: 'userId', populate: { path: 'userId', select: 'firstName lastName' } })
      .sort('-createdAt');
    res.json({ success: true, tasks });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/tasks/:id/progress  (student) — update task progress.
export const updateProgress = async (req, res, next) => {
  try {
    const { status, progressNote } = req.body;
    if (!['in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const student = await Student.findOne({ userId: req.user._id });
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (!student || String(task.studentId) !== String(student._id)) {
      return res.status(403).json({ success: false, message: 'This is not your task' });
    }

    task.status = status;
    if (progressNote !== undefined) task.progressNote = progressNote;
    if (status === 'completed') task.completedAt = new Date();
    await task.save();

    await logAudit({
      req,
      action: 'TASK_PROGRESS_UPDATE',
      entityType: 'Task',
      entityId: task._id,
      metadata: { status },
    });
    if (task.assignedBy) {
      await notify({
        userId: task.assignedBy,
        type: 'task',
        title: 'Task progress updated',
        message: `A student marked "${task.title}" as ${status.replace('_', ' ')}.`,
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
    if (String(task.assignedBy) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ success: false, message: 'Only the assigning supervisor can grade this task' });
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
