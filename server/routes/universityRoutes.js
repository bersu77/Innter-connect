import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getMyProfile,
  updateMyProfile,
  listUniversities,
  listMyStudents,
  verifyStudent,
} from '../controllers/universityController.js';

const router = Router();

// Any authenticated user may list universities (students pick theirs).
router.get('/', protect, listUniversities);
router.get('/me', protect, authorize('university'), getMyProfile);
router.put('/me', protect, authorize('university'), updateMyProfile);
router.get('/students', protect, authorize('university'), listMyStudents);
router.patch('/students/:studentId/verify', protect, authorize('university'), verifyStudent);

export default router;
