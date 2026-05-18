import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getMyProfile,
  updateMyProfile,
  listUniversities,
} from '../controllers/universityController.js';

const router = Router();

// Any authenticated user may list universities (students pick theirs).
router.get('/', protect, listUniversities);
router.get('/me', protect, authorize('university'), getMyProfile);
router.put('/me', protect, authorize('university'), updateMyProfile);

export default router;
