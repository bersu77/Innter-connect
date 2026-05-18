import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  generateReport,
  listReports,
  getReport,
  exportReport,
} from '../controllers/reportController.js';

const router = Router();

router.get('/', protect, listReports);
router.post('/', protect, authorize('university', 'company', 'admin'), generateReport);
router.get('/:id', protect, getReport);
router.get('/:id/export', protect, exportReport);

export default router;
