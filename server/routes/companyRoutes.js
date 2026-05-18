import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getMyProfile, updateMyProfile } from '../controllers/companyController.js';

const router = Router();

router.use(protect, authorize('company'));
router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);

export default router;
