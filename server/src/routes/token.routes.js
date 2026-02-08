import express from 'express';
import { joinTokenQueue, getPatientTokens, getMyToken } from '../controllers/token.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

// Patient joins token queue
router.post('/join', protect, authorize('PATIENT'), joinTokenQueue);

// Get patient's active tokens
router.get('/patient', protect, authorize('PATIENT'), getPatientTokens);

// Get patient's current active token with status
router.get('/my', protect, authorize('PATIENT'), getMyToken);

export default router;
