import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  createTask,
  listTasks,
  updateProgress,
  gradeTask,
  submitTask,
  submitGradeAppeal,
  resolveGradeAppeal,
} from '../controllers/taskController.js';

const router = Router();

router.get('/', protect, listTasks);
router.post('/', protect, authorize('company'), createTask);
router.patch('/:id/progress', protect, authorize('student'), updateProgress);
router.post('/:id/submit', protect, authorize('student'), upload.single('document'), submitTask);
router.patch('/:id/grade', protect, authorize('company'), gradeTask);
router.post('/:id/appeal', protect, authorize('student'), submitGradeAppeal);
router.patch('/:id/appeal', protect, authorize('company'), resolveGradeAppeal);

export default router;
