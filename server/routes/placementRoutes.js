import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  listPlacements,
  assignSupervisor,
  submitFinalReport,
  confirmCompletion,
  validateCompletion,
} from '../controllers/placementController.js';

const router = Router();

router.get('/', protect, listPlacements);
router.patch('/:id/supervisor', protect, authorize('company'), assignSupervisor);
router.post('/:id/report', protect, authorize('student'), upload.single('report'), submitFinalReport);
router.patch('/:id/confirm-completion', protect, authorize('company'), confirmCompletion);
router.patch('/:id/validate-completion', protect, authorize('university'), validateCompletion);

export default router;
