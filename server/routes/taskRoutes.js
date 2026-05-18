import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { createTask, listTasks, updateProgress, gradeTask } from '../controllers/taskController.js';

const router = Router();

router.get('/', protect, listTasks);
router.post('/', protect, authorize('company'), createTask);
router.patch('/:id/progress', protect, authorize('student'), updateProgress);
router.patch('/:id/grade', protect, authorize('company'), gradeTask);

export default router;
