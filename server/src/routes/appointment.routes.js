import express from 'express';
import {
    bookAppointment,
    getPatientAppointments,
    getDoctorAppointments,
} from '../controllers/appointment.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

router.post('/', protect, authorize('PATIENT'), bookAppointment);
router.get('/patient', protect, authorize('PATIENT'), getPatientAppointments);
router.get('/doctor', protect, authorize('DOCTOR'), getDoctorAppointments);

export default router;
