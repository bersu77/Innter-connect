import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getMyProfile, updateMyProfile, listCompanies } from '../controllers/companyController.js';

const router = Router();

// Any authenticated user may search companies (universities find partners).
router.get('/', protect, listCompanies);
router.get('/me', protect, authorize('company'), getMyProfile);
router.put('/me', protect, authorize('company'), updateMyProfile);

export default router;
