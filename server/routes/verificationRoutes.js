import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  submitAppeal,
  listAppeals,
  decideAppeal,
  myVerifications,
} from '../controllers/verificationController.js';

const router = Router();

router.get('/mine', protect, myVerifications);
router.get('/appeals', protect, authorize('admin'), listAppeals);
router.patch('/appeals/:id', protect, authorize('admin'), decideAppeal);
router.post('/:verificationId/appeal', protect, submitAppeal);

export default router;
