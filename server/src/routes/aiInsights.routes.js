import express from 'express';
import { analyzeReport } from '../controllers/aiInsights.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

// Analyze uploaded report - restricted to PATIENT
router.post('/analyze-report/:reportId', protect, authorize('PATIENT'), analyzeReport);

export default router;
