import {
    bookAppointment as bookAppointmentService,
    getPatientAppointments as getPatientAppointmentsService,
    getDoctorAppointments as getDoctorAppointmentsService,
    updateAppointmentStatus as updateAppointmentStatusService,
    getAppointmentDetails as getAppointmentDetailsService,
} from '../services/appointment.service.js';

import {
    completeConsultation as completeConsultationService,
} from '../../clinical/index.js';

import {
    getOrCreateDoctorProfile,
} from '../../../services/doctor.service.js';


export const bookAppointment = async (req, res, next) => {
    try {
        const { doctorId, date, time } = req.body;

        if (!doctorId || !date || !time) {
            res.status(400);
            return next(
                new Error('Please provide doctorId, date, and time')
            );
        }

        const appointment = await bookAppointmentService({
            patientId: req.user._id || req.user.id,
            doctorId,
            date,
            time,
        });

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully',
            appointment,
        });
    } catch (error) {
        next(error);
    }
};


export const getPatientAppointments = async (req, res, next) => {
    try {
        const patientId = req.user._id || req.user.id;

        const appointments =
            await getPatientAppointmentsService(patientId);

        res.status(200).json({
            success: true,
            count: appointments.length,
            data: appointments,
        });
    } catch (error) {
        next(error);
    }
};


export const getDoctorAppointments = async (req, res, next) => {
    try {
        const doctorDoc = await getOrCreateDoctorProfile(req.user._id || req.user.id);

        const appointments =
            await getDoctorAppointmentsService(doctorDoc._id);

        res.status(200).json({
            success: true,
            appointments,
        });
    } catch (error) {
        next(error);
    }
};


export const updateAppointmentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const doctorDoc = await getOrCreateDoctorProfile(req.user._id);

        const appointment =
            await updateAppointmentStatusService({
                appointmentId: id,
                doctorProfileId: doctorDoc._id,
                status,
            });

        res.status(200).json({
            success: true,
            data: appointment,
        });
    } catch (error) {
        if (error.statusCode) {
            res.status(error.statusCode);
        }

        next(error);
    }
};


export const completeConsultation = async (req, res, next) => {
    try {
        const { id } = req.params;

        const {
            diagnosis,
            prescription,
            consultationNotes,
        } = req.body;

        const doctorDoc = await getOrCreateDoctorProfile(req.user._id);

        const updated =
            await completeConsultationService({
                appointmentId: id,
                doctorProfileId: doctorDoc._id,
                doctorName: req.user.name,
                diagnosis,
                prescription,
                consultationNotes,
            });

        res.status(200).json({
            success: true,
            message: 'Consultation completed successfully',
            data: updated,
        });
    } catch (error) {
        if (error.statusCode) {
            res.status(error.statusCode);
        }

        next(error);
    }
};


export const getAppointmentDetails = async (req, res, next) => {
    try {
        const { id } = req.params;

        const doctorDoc = await getOrCreateDoctorProfile(req.user._id);

        const data =
            await getAppointmentDetailsService({
                appointmentId: id,
                doctorProfileId: doctorDoc._id,
            });

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        if (error.statusCode) {
            res.status(error.statusCode);
        }

        next(error);
    }
};
