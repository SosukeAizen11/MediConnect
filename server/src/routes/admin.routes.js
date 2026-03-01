import express from 'express';
import {
    getPendingClinics,
    approveClinic,
    deleteClinic,
    getAllClinics,
    toggleClinicStatus,
    getAllUsers,
    toggleUserStatus,
    deleteUser as deleteUserController,
    getSystemAnalytics,
} from '../controllers/admin.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/admin.middleware.js';

const router = express.Router();

// Clinic Routes
router.get('/clinics', protect, adminOnly, getAllClinics);
router.get('/clinics/pending', protect, adminOnly, getPendingClinics);
router.put('/clinics/:id/approve', protect, adminOnly, approveClinic);
router.put('/clinics/:id/toggle', protect, adminOnly, toggleClinicStatus);
router.delete('/clinics/:id', protect, adminOnly, deleteClinic);

// User Routes
router.get('/users', protect, adminOnly, getAllUsers);
router.put('/users/:id/toggle', protect, adminOnly, toggleUserStatus);
router.delete('/users/:id', protect, adminOnly, deleteUserController);

// Analytics Route
router.get('/analytics', protect, adminOnly, getSystemAnalytics);

export default router;
