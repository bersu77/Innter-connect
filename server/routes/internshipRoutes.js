import { Router } from 'express';
import { protect, softProtect, authorize } from '../middleware/auth.js';
import {
  createInternship,
  listInternships,
  listMyInternships,
  getInternship,
  updateInternship,
  updateStatus,
} from '../controllers/internshipController.js';

const router = Router();

// Public browse — anyone (logged in or out) can list and view active
// internships. softProtect attaches req.user when a token is present so the
// controller can still serve non-active postings to the owning company or an
// admin; anonymous callers only see status:'active'.
router.get('/', softProtect, listInternships);
router.get('/mine', protect, authorize('company'), listMyInternships);
router.post('/', protect, authorize('company'), createInternship);
router.get('/:id', softProtect, getInternship);
router.put('/:id', protect, authorize('company'), updateInternship);
router.patch('/:id/status', protect, authorize('company'), updateStatus);

export default router;
