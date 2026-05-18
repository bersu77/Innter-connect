import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { listAuditLogs, auditStats } from '../controllers/auditController.js';

const router = Router();

// Audit review is restricted to administrators / auditors.
router.use(protect, authorize('admin'));
router.get('/logs', listAuditLogs);
router.get('/stats', auditStats);

export default router;
