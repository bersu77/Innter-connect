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
import { listMessages, sendMessage } from '../controllers/messageController.js';

const router = Router();

router.get('/', protect, listPlacements);
router.patch('/:id/supervisor', protect, authorize('company'), assignSupervisor);
router.post('/:id/report', protect, authorize('student'), upload.single('report'), submitFinalReport);
router.patch('/:id/confirm-completion', protect, authorize('company'), confirmCompletion);
router.patch('/:id/validate-completion', protect, authorize('university'), validateCompletion);

// Chat thread (intern ↔ supervisor)
router.get('/:id/messages', protect, listMessages);
router.post('/:id/messages', protect, sendMessage);

export default router;
