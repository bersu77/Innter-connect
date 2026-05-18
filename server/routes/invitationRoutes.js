import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  sendInvitation,
  listInvitations,
  respondInvitation,
} from '../controllers/invitationController.js';

const router = Router();

router.get('/', protect, listInvitations);
router.post('/', protect, authorize('university'), sendInvitation);
router.patch('/:id/respond', protect, authorize('company'), respondInvitation);

export default router;
