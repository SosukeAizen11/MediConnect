import {
    bookAppointment as bookAppointmentService,
    getPatientAppointments as getPatientAppointmentsService,
    getDoctorAppointments as getDoctorAppointmentsService,
    updateAppointmentStatus as updateAppointmentStatusService,
    getAppointmentDetails as getAppointmentDetailsService,
} from '../services/appointment.service.js';

import {
    completeConsultation as completeConsultationService,
    getPrescriptionUrlsForAppointments,
    getConsultationByAppointmentId,
    getPatientConsultationHistory,
} from '../../clinical/index.js';

import {
    getOrCreateDoctorProfile,
} from '../../identity/index.js';


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

        const appointmentIds = appointments.map((appt) => appt._id);
        const prescriptionUrls = await getPrescriptionUrlsForAppointments(appointmentIds);

        const data = appointments.map((appt) => {
            const apptObj = appt.toObject ? appt.toObject() : { ...appt };
            const clinicalUrl = prescriptionUrls[appt._id.toString()];
            return {
                ...apptObj,
                prescriptionUrl: clinicalUrl || apptObj.prescriptionUrl || '',
            };
        });

        res.status(200).json({
            success: true,
            count: data.length,
            data,
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

        const appointment =
            await getAppointmentDetailsService({
                appointmentId: id,
                doctorProfileId: doctorDoc._id,
            });

        const [consultation, consultationHistory] = await Promise.all([
            getConsultationByAppointmentId(id),
            getPatientConsultationHistory({
                patientId: appointment.patient._id,
                doctorProfileId: doctorDoc._id,
                limit: 10,
            }),
        ]);

        const appointmentObj = appointment.toObject ? appointment.toObject() : { ...appointment };
        if (consultation) {
            appointmentObj.diagnosis = consultation.diagnosis || appointmentObj.diagnosis || '';
            appointmentObj.prescription = consultation.prescription || appointmentObj.prescription || '';
            appointmentObj.consultationNotes = consultation.consultationNotes || appointmentObj.consultationNotes || '';
            appointmentObj.prescriptionUrl = consultation.prescriptionUrl || appointmentObj.prescriptionUrl || '';
        }

        const pastAppointments = (consultationHistory || [])
            .filter((c) => {
                const isCurrentAppointment = c.appointment && (
                    (c.appointment._id && c.appointment._id.toString() === id.toString()) ||
                    c.appointment.toString() === id.toString()
                );
                const isCurrentConsultation = consultation && c._id.toString() === consultation._id.toString();
                return !isCurrentAppointment && !isCurrentConsultation;
            })
            .map((c) => ({
                _id: c._id,
                date: c.consultationDate || (c.appointment && c.appointment.date) || (c.completedAt ? new Date(c.completedAt).toISOString().split('T')[0] : ''),
                time: (c.appointment && c.appointment.time) || (c.completedAt ? new Date(c.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
                status: 'COMPLETED',
                diagnosis: c.diagnosis || '',
                prescription: c.prescription || '',
                consultationNotes: c.consultationNotes || '',
                prescriptionUrl: c.prescriptionUrl || '',
                clinic: c.clinic || null,
                doctor: c.doctor || null,
                originType: c.originType,
            }));

        res.status(200).json({
            success: true,
            data: {
                appointment: appointmentObj,
                pastAppointments,
            },
        });
    } catch (error) {
        if (error.statusCode) {
            res.status(error.statusCode);
        }

        next(error);
    }
};
