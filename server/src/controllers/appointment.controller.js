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
        let doctorDoc = await Doctor.findOne({ user: req.user._id });

        // Lazy creation: auto-create profile if missing
        if (!doctorDoc) {
            doctorDoc = await Doctor.create({ user: req.user._id });
        }

        const appointments = await Appointment.find({ doctor: doctorDoc._id })
            .populate('patient', 'name email phone')
            .populate('clinic', 'name address')
            .sort({ date: 1, time: 1 });

        res.status(200).json({
            success: true,
            count: appointments.length,
            data: appointments,
        });
    } catch (error) {
        next(error);
    }
};

export const updateAppointmentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['COMPLETED', 'CANCELLED'].includes(status)) {
            res.status(400);
            return next(new Error('Status must be COMPLETED or CANCELLED'));
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

        if (appointment.status !== 'BOOKED') {
            res.status(400);
            return next(new Error('Can only complete a BOOKED appointment'));
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
