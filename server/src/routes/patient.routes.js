import express from 'express';
import { getProfile, updateProfile, getDashboardStats } from '../controllers/patient.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

// Get patient profile
router.get('/profile', protect, authorize('PATIENT'), getProfile);

// Update patient profile
router.put('/profile', protect, authorize('PATIENT'), updateProfile);

// Get dashboard stats
router.get('/dashboard', protect, authorize('PATIENT'), getDashboardStats);

export default router;
