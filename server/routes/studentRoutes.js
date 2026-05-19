import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  getMyProfile,
  updateMyProfile,
  uploadCv,
  addPortfolioItem,
  removePortfolioItem,
} from '../controllers/studentController.js';

const router = Router();

router.use(protect, authorize('student'));
router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);
router.post('/me/cv', upload.single('cv'), uploadCv);
router.post('/me/portfolio', upload.single('file'), addPortfolioItem);
router.delete('/me/portfolio/:index', removePortfolioItem);

export default router;
