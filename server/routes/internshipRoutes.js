import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  createInternship,
  listInternships,
  listMyInternships,
  getInternship,
  updateInternship,
  updateStatus,
} from '../controllers/internshipController.js';

const router = Router();

router.get('/', protect, listInternships);
router.get('/mine', protect, authorize('company'), listMyInternships);
router.post('/', protect, authorize('company'), createInternship);
router.get('/:id', protect, getInternship);
router.put('/:id', protect, authorize('company'), updateInternship);
router.patch('/:id/status', protect, authorize('company'), updateStatus);

export default router;
