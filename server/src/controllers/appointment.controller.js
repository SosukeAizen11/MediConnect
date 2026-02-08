import Appointment from '../models/appointment.model.js';
import Doctor from '../models/doctor.model.js';
import Clinic from '../models/clinic.model.js';

export const bookAppointment = async (req, res, next) => {
    try {
        const { doctor, clinic, date, time } = req.body;

        if (!doctor || !clinic || !date || !time) {
            res.status(400);
            return next(new Error('Please provide doctor, clinic, date, and time'));
        }

        // Check clinic exists and is of type APPOINTMENT
        const clinicDoc = await Clinic.findById(clinic);
        if (!clinicDoc) {
            res.status(404);
            return next(new Error('Clinic not found'));
        }

        if (clinicDoc.clinicType !== 'APPOINTMENT') {
            res.status(400);
            return next(new Error('This clinic does not support appointments'));
        }

        // Check doctor exists and belongs to the clinic
        const doctorDoc = await Doctor.findById(doctor);
        if (!doctorDoc) {
            res.status(404);
            return next(new Error('Doctor not found'));
        }

        if (doctorDoc.clinic.toString() !== clinic) {
            res.status(400);
            return next(new Error('Doctor does not belong to this clinic'));
        }

        // Check for double booking
        const existingAppointment = await Appointment.findOne({
            doctor,
            date,
            time,
            status: { $ne: 'CANCELLED' },
        });

        if (existingAppointment) {
            res.status(400);
            return next(new Error('This time slot is already booked'));
        }

        const appointment = await Appointment.create({
            patient: req.user._id,
            doctor,
            clinic,
            date,
            time,
        });

        res.status(201).json({
            success: true,
            data: appointment,
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
        // Find doctor profile for logged-in user
        const doctorDoc = await Doctor.findOne({ user: req.user._id });
        if (!doctorDoc) {
            res.status(404);
            return next(new Error('Doctor profile not found'));
        }

        const appointments = await Appointment.find({ doctor: doctorDoc._id })
            .populate('patient', 'name email')
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
