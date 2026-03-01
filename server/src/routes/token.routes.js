import express from 'express';
import {
    joinTokenQueue,
    getPatientTokens,
    getMyToken,
    getDoctorTokenQueue,
    advanceToken,
    getTokenDetails,
    completeTokenConsultation,
} from '../controllers/token.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

// Patient routes
router.post('/join', protect, authorize('PATIENT'), joinTokenQueue);
router.get('/patient', protect, authorize('PATIENT'), getPatientTokens);
router.get('/my', protect, authorize('PATIENT'), getMyToken);

// Doctor routes
router.get('/doctor', protect, authorize('DOCTOR'), getDoctorTokenQueue);
router.put('/next', protect, authorize('DOCTOR'), advanceToken);
router.get('/:tokenId/details', protect, authorize('DOCTOR'), getTokenDetails);
router.put('/:tokenId/complete', protect, authorize('DOCTOR'), completeTokenConsultation);

export default router;
