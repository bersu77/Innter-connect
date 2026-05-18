import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { createTask, listTasks, updateProgress } from '../controllers/taskController.js';

const router = Router();

router.get('/', protect, listTasks);
router.post('/', protect, authorize('company'), createTask);
router.patch('/:id/progress', protect, authorize('student'), updateProgress);

export default router;
