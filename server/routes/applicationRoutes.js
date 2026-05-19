import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  applyToInternship,
  listApplications,
  getApplication,
  updateApplicationStatus,
  withdrawApplication,
  respondToOffer,
  verifyApplication,
} from '../controllers/applicationController.js';

const router = Router();

router.get('/', protect, listApplications);
router.post('/', protect, authorize('student'), applyToInternship);
router.get('/:id', protect, getApplication);
router.patch('/:id/status', protect, authorize('company'), updateApplicationStatus);
router.patch('/:id/verify', protect, authorize('university'), verifyApplication);
router.patch('/:id/withdraw', protect, authorize('student'), withdrawApplication);
router.patch('/:id/respond-offer', protect, authorize('student'), respondToOffer);

export default router;
