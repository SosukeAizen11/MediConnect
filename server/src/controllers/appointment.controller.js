import Appointment from '../models/appointment.model.js';
import Doctor from '../models/doctor.model.js';
import Clinic from '../models/clinic.model.js';
import DoctorAvailability from '../models/doctorAvailability.model.js';
import DoctorLeave from '../models/doctorLeave.model.js';
import User from '../models/user.model.js';
import { generateSlots } from '../utils/slotGenerator.js';
import { generatePrescriptionPDF } from '../utils/generatePrescription.js';
import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';

export const bookAppointment = async (req, res, next) => {
    try {
        const { doctorId, date, time } = req.body;

        if (!doctorId || !date || !time) {
            res.status(400);
            return next(new Error('Please provide doctorId, date, and time'));
        }

        // Resolve doctorId — could be Doctor profile _id or User _id
        let userIdForAvailability = doctorId;
        let doctorProfile = await Doctor.findById(doctorId);

        if (doctorProfile) {
            // doctorId is a Doctor profile _id → use its user field
            userIdForAvailability = doctorProfile.user.toString();
        } else {
            // doctorId might be a User _id — look up Doctor profile by user
            doctorProfile = await Doctor.findOne({ user: doctorId });
            if (!doctorProfile) {
                res.status(404);
                return next(new Error('Doctor profile not found'));
            }
        }

        // 0.5 Check if doctor is on leave
        const leave = await DoctorLeave.findOne({
            doctor: userIdForAvailability,
            date,
        });

        if (leave) {
            res.status(400);
            return next(new Error('Doctor is on leave on this date'));
        }

        // 1. Check doctor availability for this day
        const [year, month, day] = date.split('-').map(Number);
        const dayOfWeek = new Date(year, month - 1, day).getDay();
        const availability = await DoctorAvailability.findOne({
            doctor: userIdForAvailability,
            dayOfWeek,
            isActive: true,
        });

        if (!availability) {
            res.status(400);
            return next(new Error('Doctor is not available on this day'));
        }

        // 2. Generate valid slots and check if requested time is valid
        const validSlots = generateSlots(
            availability.startTime,
            availability.endTime,
            availability.slotDuration
        );

        if (!validSlots.includes(time)) {
            res.status(400);
            return next(new Error('Invalid time slot'));
        }

        // 3. Check if slot is already booked (match both IDs)
        const existingAppointment = await Appointment.findOne({
            $or: [
                { doctor: doctorId },
                { doctor: userIdForAvailability }
            ],
            date,
            time,
            status: { $ne: 'CANCELLED' },
        });

        if (existingAppointment) {
            res.status(400);
            return next(new Error('Slot already booked'));
        }

        if (!doctorProfile.clinic) {
            res.status(400);
            return next(new Error('Doctor is not associated with any clinic'));
        }

        // 5. Create appointment
        const appointment = await Appointment.create({
            patient: req.user._id || req.user.id,
            doctor: doctorProfile._id,
            clinic: doctorProfile.clinic,
            date,
            time,
            status: 'CONFIRMED',
        });

        // 6. Return response
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
        const appointments = await Appointment.find({ patient: req.user._id })
            .populate({
                path: 'doctor',
                populate: { path: 'user', select: 'name email' },
            })
            .populate('clinic', 'name address')
            .sort({ createdAt: -1 });

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

        // Query appointments where doctor is either the Doctor profile _id
        // or the User _id (for slot-based bookings)
        const appointments = await Appointment.find({
            $or: [
                { doctor: doctorDoc._id },
                { doctor: doctorId }
            ]
        })
            .populate('patient', 'name email phone')
            .populate('clinic', 'name address')
            .sort({ date: 1, time: 1 });

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

        if (!status || !['CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status)) {
            res.status(400);
            return next(new Error('Status must be CONFIRMED, COMPLETED, or CANCELLED'));
        }

        // Find doctor profile for logged-in user
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

        // Ensure this appointment belongs to the logged-in doctor
        if (appointment.doctor.toString() !== doctorDoc._id.toString()) {
            res.status(403);
            return next(new Error('Not authorized to update this appointment'));
        }

        appointment.status = status;
        await appointment.save();

        res.status(200).json({
            success: true,
            data: appointment,
        });
    } catch (error) {
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
