import express from 'express';
import {
    registerClinic,
    getApprovedClinics,
    getClinicById,
    approveClinic,
} from '../controllers/clinic.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/admin.middleware.js';

const router = express.Router();

router.post('/register', registerClinic);
router.get('/', getApprovedClinics);
router.get('/:id', getClinicById);
router.patch('/:id/approve', protect, adminOnly, approveClinic);

export default router;
