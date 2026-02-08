import express from 'express';
import {
    createDoctorProfile,
    getDoctorsByClinic,
} from '../controllers/doctor.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

router.post('/profile', protect, authorize('DOCTOR'), createDoctorProfile);
router.get('/clinic/:clinicId', getDoctorsByClinic);

export default router;
