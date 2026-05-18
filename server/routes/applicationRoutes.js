import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  applyToInternship,
  listApplications,
  getApplication,
  updateApplicationStatus,
} from '../controllers/applicationController.js';

const router = Router();

router.get('/', protect, listApplications);
router.post('/', protect, authorize('student'), applyToInternship);
router.get('/:id', protect, getApplication);
router.patch('/:id/status', protect, authorize('company'), updateApplicationStatus);

export default router;
