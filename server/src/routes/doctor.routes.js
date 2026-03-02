import express from 'express';
import {
    createDoctorProfile,
    getDoctorProfile,
    updateDoctorProfile,
    getDoctorsByClinic,
    getMyPatients,
    getDashboardStats,
} from '../controllers/doctor.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

router.post('/profile', protect, authorize('DOCTOR'), createDoctorProfile);
router.get('/profile', protect, authorize('DOCTOR'), getDoctorProfile);
router.put('/profile', protect, authorize('DOCTOR'), updateDoctorProfile);
router.get('/clinic/:clinicId', getDoctorsByClinic);
router.get('/my-patients', protect, authorize('DOCTOR'), getMyPatients);
router.get('/dashboard', protect, authorize('DOCTOR'), getDashboardStats);

export default router;
