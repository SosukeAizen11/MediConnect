import Appointment from '../models/appointment.model.js';
import Doctor from '../models/doctor.model.js';
import User from '../models/user.model.js';
import { generatePrescriptionPDF } from '../utils/generatePrescription.js';
import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';
import {
    bookAppointment as bookAppointmentService,
    getPatientAppointments as getPatientAppointmentsService,
    getDoctorAppointments as getDoctorAppointmentsService,
    updateAppointmentStatus as updateAppointmentStatusService,
} from '../modules/scheduling/index.js';

export const bookAppointment = async (req, res, next) => {
    try {
        const { doctorId, date, time } = req.body;

        if (!doctorId || !date || !time) {
            res.status(400);
            return next(new Error('Please provide doctorId, date, and time'));
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
        const appointments = await getPatientAppointmentsService(patientId);

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
        const doctorId = req.user._id || req.user.id;

        // Find doctor profile for logged-in user
        let doctorDoc = await Doctor.findOne({ user: doctorId });

        // Lazy creation: auto-create profile if missing
        if (!doctorDoc) {
            doctorDoc = await Doctor.create({ user: doctorId });
        }

        // Query appointments using canonical Doctor profile _id via Scheduling facade
        const appointments = await getDoctorAppointmentsService(doctorDoc._id);

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

        // Find doctor profile for logged-in user
        const doctorDoc = await Doctor.findOne({ user: req.user._id });
        if (!doctorDoc) {
            res.status(404);
            return next(new Error('Doctor profile not found'));
        }

        const appointment = await updateAppointmentStatusService({
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
        const { diagnosis, prescription, consultationNotes } = req.body;

        if (!diagnosis) {
            res.status(400);
            return next(new Error('Diagnosis is required'));
        }

        const doctorDoc = await Doctor.findOne({ user: req.user._id });
        if (!doctorDoc) {
            res.status(404);
            return next(new Error('Doctor profile not found'));
        }

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            res.status(404);
            return next(new Error('Appointment not found'));
        }

        if (appointment.doctor.toString() !== doctorDoc._id.toString()) {
            res.status(403);
            return next(new Error('Not authorized to update this appointment'));
        }

        if (!['BOOKED', 'CONFIRMED'].includes(appointment.status)) {
            res.status(400);
            return next(new Error('Can only complete a BOOKED or CONFIRMED appointment'));
        }

        // Generate PDF
        try {
            const patientObj = await User.findById(appointment.patient);
            const patientName = patientObj?.name || 'Patient';
            const docName = req.user.name || 'Doctor';

            const pdfBuffer = await generatePrescriptionPDF({
                patientName,
                doctorName: `Dr. ${docName}`,
                diagnosis,
                prescription: prescription || '',
                notes: consultationNotes || '',
                date: appointment.date
            });

            // Upload PDF to Cloudinary
            const uploadToCloudinary = (buffer) => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        {
                            folder: "mediconnect/prescriptions",
                            resource_type: "auto",
                            type: "upload"
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    streamifier.createReadStream(buffer).pipe(stream);
                });
            };

            const cloudinaryResult = await uploadToCloudinary(pdfBuffer);
            appointment.prescriptionUrl = cloudinaryResult.secure_url;

        } catch (pdfError) {
            console.error('Failed to generate or upload Prescription PDF:', pdfError);
            // Non-blocking error, we still complete the consultation
        }

        appointment.diagnosis = diagnosis;
        appointment.prescription = prescription || '';
        appointment.consultationNotes = consultationNotes || '';
        appointment.status = 'COMPLETED';
        await appointment.save();

        const updated = await Appointment.findById(id)
            .populate('patient', 'name email phone')
            .populate('clinic', 'name address');

        res.status(200).json({
            success: true,
            message: 'Consultation completed successfully',
            data: updated,
        });
    } catch (error) {
        next(error);
    }
};

export const getAppointmentDetails = async (req, res, next) => {
    try {
        const { id } = req.params;

        const doctorDoc = await Doctor.findOne({ user: req.user._id });
        if (!doctorDoc) {
            res.status(404);
            return next(new Error('Doctor profile not found'));
        }

        const appointment = await Appointment.findById(id)
            .populate('patient', 'name email phone gender dateOfBirth address emergencyContact')
            .populate('clinic', 'name address')
            .populate({
                path: 'doctor',
                populate: { path: 'user', select: 'name email' },
            });

        if (!appointment) {
            res.status(404);
            return next(new Error('Appointment not found'));
        }

        if (appointment.doctor._id.toString() !== doctorDoc._id.toString()) {
            res.status(403);
            return next(new Error('Not authorized to view this appointment'));
        }

        // Get patient's past appointments with this doctor
        const pastAppointments = await Appointment.find({
            patient: appointment.patient._id,
            doctor: doctorDoc._id,
            status: 'COMPLETED',
            _id: { $ne: id },
        })
            .populate('clinic', 'name')
            .sort({ date: -1, time: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            data: {
                appointment,
                pastAppointments,
            },
        });
    } catch (error) {
        next(error);
    }
};
