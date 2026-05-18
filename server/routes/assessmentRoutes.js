import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  requestAssessment,
  listAssessments,
  submitAssessment,
} from '../controllers/assessmentController.js';

const router = Router();

router.get('/', protect, listAssessments);
router.post('/', protect, authorize('student'), requestAssessment);
router.patch('/:id', protect, authorize('company'), submitAssessment);

export default router;
