import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { listPlacements, assignSupervisor } from '../controllers/placementController.js';

const router = Router();

router.get('/', protect, listPlacements);
router.patch('/:id/supervisor', protect, authorize('company'), assignSupervisor);

export default router;
