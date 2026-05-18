import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { submitAppeal, listAppeals, decideAppeal } from '../controllers/verificationController.js';

const router = Router();

router.post('/:verificationId/appeal', protect, submitAppeal);
router.get('/appeals', protect, authorize('admin'), listAppeals);
router.patch('/appeals/:id', protect, authorize('admin'), decideAppeal);

export default router;
