import express from 'express';
import { getPatientHistory } from '../controllers/consultation.controller.js';
import { protect } from '../../auth/index.js';
import { authorize } from '../../../middleware/role.middleware.js';

const router = express.Router();

// GET /api/v1/consultations/patient
router.get('/patient', protect, authorize('PATIENT'), getPatientHistory);

export default router;
