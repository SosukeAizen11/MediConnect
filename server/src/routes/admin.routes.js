import express from 'express';
import {
    getPendingClinics,
    approveClinic,
    deleteClinic,
    getAllClinics,
    toggleClinicStatus,
} from '../controllers/admin.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/admin.middleware.js';

const router = express.Router();

router.get('/clinics', protect, adminOnly, getAllClinics);
router.get('/clinics/pending', protect, adminOnly, getPendingClinics);
router.put('/clinics/:id/approve', protect, adminOnly, approveClinic);
router.put('/clinics/:id/toggle', protect, adminOnly, toggleClinicStatus);
router.delete('/clinics/:id', protect, adminOnly, deleteClinic);

export default router;
