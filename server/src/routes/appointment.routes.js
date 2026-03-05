import express from 'express';
import {
    bookAppointment,
    getPatientAppointments,
    getDoctorAppointments,
    updateAppointmentStatus,
    completeConsultation,
    getAppointmentDetails,
} from '../controllers/appointment.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

router.post('/', protect, authorize('PATIENT'), bookAppointment);
router.get('/patient', protect, authorize('PATIENT'), getPatientAppointments);
router.get('/doctor', protect, authorize('DOCTOR'), getDoctorAppointments);
router.put('/:id/status', protect, authorize('DOCTOR'), updateAppointmentStatus);
router.patch('/:id/status', protect, authorize('DOCTOR'), updateAppointmentStatus);
router.put('/:id/consult', protect, authorize('DOCTOR'), completeConsultation);
router.get('/:id/details', protect, authorize('DOCTOR'), getAppointmentDetails);

export default router;
