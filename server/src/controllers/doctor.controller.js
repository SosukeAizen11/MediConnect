import Doctor from '../models/doctor.model.js';
import Clinic from '../models/clinic.model.js';
import Appointment from '../models/appointment.model.js';
import Token from '../models/token.model.js';
import DoctorPost from '../models/post.model.js';

export const createDoctorProfile = async (req, res, next) => {
    try {
        const { clinic, specialization, experienceYears } = req.body;

        if (!clinic || !specialization) {
            res.status(400);
            return next(new Error('Please provide clinic and specialization'));
        }

        // Check if user already has a doctor profile
        const existingProfile = await Doctor.findOne({ user: req.user._id });
        if (existingProfile) {
            res.status(400);
            return next(new Error('Doctor profile already exists for this user'));
        }

        // Check if clinic exists and is approved
        const clinicDoc = await Clinic.findById(clinic);
        if (!clinicDoc) {
            res.status(404);
            return next(new Error('Clinic not found'));
        }

        if (!clinicDoc.isApproved) {
            res.status(400);
            return next(new Error('Cannot create profile for unapproved clinic'));
        }

        const doctor = await Doctor.create({
            user: req.user._id,
            clinic,
            specialization,
            experienceYears,
        });

        res.status(201).json({
            success: true,
            data: doctor,
        });
    } catch (error) {
        next(error);
    }
};

export const getDoctorProfile = async (req, res, next) => {
    try {
        let doctor = await Doctor.findOne({ user: req.user._id })
            .populate('user', 'name email phone')
            .populate('clinic', 'name address clinicType isApproved isActive');

        // Lazy creation: auto-create profile if missing
        if (!doctor) {
            await Doctor.create({ user: req.user._id });
            doctor = await Doctor.findOne({ user: req.user._id })
                .populate('user', 'name email phone')
                .populate('clinic', 'name address clinicType isApproved isActive');
        }

        res.status(200).json({
            success: true,
            data: doctor,
        });
    } catch (error) {
        next(error);
    }
};

export const updateDoctorProfile = async (req, res, next) => {
    try {
        const { clinic, specialization, experienceYears } = req.body;

        const doctor = await Doctor.findOne({ user: req.user._id });
        if (!doctor) {
            res.status(404);
            return next(new Error('Doctor profile not found'));
        }

        // Validate clinic if provided
        if (clinic) {
            const clinicDoc = await Clinic.findById(clinic);
            if (!clinicDoc) {
                res.status(404);
                return next(new Error('Clinic not found'));
            }
            if (!clinicDoc.isApproved) {
                res.status(400);
                return next(new Error('Cannot link to unapproved clinic'));
            }
            doctor.clinic = clinic;
        }

        if (specialization !== undefined) doctor.specialization = specialization;
        if (experienceYears !== undefined) doctor.experienceYears = experienceYears;

        await doctor.save();

        const updated = await Doctor.findById(doctor._id)
            .populate('user', 'name email phone')
            .populate('clinic', 'name address clinicType');

        res.status(200).json({
            success: true,
            data: updated,
        });
    } catch (error) {
        next(error);
    }
};

export const getDoctorsByClinic = async (req, res, next) => {
    try {
        const { clinicId } = req.params;

        const doctors = await Doctor.find({ clinic: clinicId })
            .populate('user', 'name email')
            .populate('clinic', 'name address');

        res.status(200).json({
            success: true,
            count: doctors.length,
            data: doctors,
        });
    } catch (error) {
        next(error);
    }
};

export const getMyPatients = async (req, res, next) => {
    try {
        let doctorDoc = await Doctor.findOne({ user: req.user._id });
        if (!doctorDoc) {
            doctorDoc = await Doctor.create({ user: req.user._id });
        }

        // Patients from completed appointments
        const completedAppointments = await Appointment.find({
            doctor: doctorDoc._id,
            status: 'COMPLETED',
        })
            .populate('patient', 'name phone')
            .sort({ date: -1, time: -1 });

        // Patients from completed tokens (via doctor's clinic)
        let completedTokens = [];
        if (doctorDoc.clinic) {
            completedTokens = await Token.find({
                clinic: doctorDoc.clinic,
                status: 'COMPLETED',
            })
                .populate('patient', 'name phone')
                .sort({ date: -1 });
        }

        // Merge and deduplicate
        const patientMap = new Map();

        for (const apt of completedAppointments) {
            if (!apt.patient) continue;
            const pid = apt.patient._id.toString();
            if (!patientMap.has(pid)) {
                patientMap.set(pid, {
                    patientId: pid,
                    fullName: apt.patient.name,
                    phone: apt.patient.phone || '',
                    lastVisitDate: apt.date,
                });
            }
        }

        for (const tkn of completedTokens) {
            if (!tkn.patient) continue;
            const pid = tkn.patient._id.toString();
            const visitDate = tkn.date ? new Date(tkn.date).toISOString().split('T')[0] : '';
            if (!patientMap.has(pid)) {
                patientMap.set(pid, {
                    patientId: pid,
                    fullName: tkn.patient.name,
                    phone: tkn.patient.phone || '',
                    lastVisitDate: visitDate,
                });
            } else {
                // Update last visit date if this token is more recent
                const existing = patientMap.get(pid);
                if (visitDate && visitDate > existing.lastVisitDate) {
                    existing.lastVisitDate = visitDate;
                }
            }
        }

        const patients = Array.from(patientMap.values()).sort((a, b) =>
            b.lastVisitDate.localeCompare(a.lastVisitDate)
        );

        res.status(200).json({
            success: true,
            count: patients.length,
            data: patients,
        });
    } catch (error) {
        next(error);
    }
};

export const getDashboardStats = async (req, res, next) => {
    try {
        const doctorDoc = await Doctor.findOne({ user: req.user._id });
        if (!doctorDoc) {
            return res.status(404).json({ success: false, message: 'Doctor profile not found' });
        }

        const doctorId = doctorDoc._id;

        // 1. Total Posts
        const totalPosts = await DoctorPost.countDocuments({ author: req.user._id });

        // 2. Today's Appointments
        // Date in Appointment model is stored as a string "YYYY-MM-DD"
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];

        const todayAppointments = await Appointment.countDocuments({
            doctor: doctorId,
            date: dateString
        });

        // 3. Pending Appointments
        const pendingAppointments = await Appointment.countDocuments({
            doctor: doctorId,
            status: { $in: ['BOOKED', 'CONFIRMED'] }
        });

        // 4. Active Tokens
        let activeTokens = 0;
        if (doctorDoc.clinic) {
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);

            activeTokens = await Token.countDocuments({
                clinic: doctorDoc.clinic,
                date: todayDate,
                status: 'WAITING'
            });
        }

        res.status(200).json({
            success: true,
            totalPosts,
            todayAppointments,
            pendingAppointments,
            activeTokens
        });

    } catch (error) {
        next(error);
    }
};
