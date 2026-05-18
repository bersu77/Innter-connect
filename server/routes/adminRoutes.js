import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  listUsers,
  updateUserStatus,
  getStats,
  listOrganizations,
  verifyOrganization,
} from '../controllers/adminController.js';

const router = Router();

router.use(protect, authorize('admin'));
router.get('/users', listUsers);
router.patch('/users/:id/status', updateUserStatus);
router.get('/stats', getStats);
router.get('/organizations', listOrganizations);
router.patch('/organizations/:type/:id/verify', verifyOrganization);

export default router;
