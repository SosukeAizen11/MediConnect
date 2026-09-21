import Doctor from '../models/doctor.model.js';
import Clinic from '../models/clinic.model.js';
import Token from '../models/token.model.js';
import DoctorPost from '../models/post.model.js';

import { getDoctorAppointmentStats } from '../modules/scheduling/index.js';
import { getDoctorConsultedPatients } from '../modules/clinical/index.js';

import { getOrCreateDoctorProfile } from '../services/doctor.service.js';

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
        const doctor = await getOrCreateDoctorProfile(req.user._id);

        await doctor.populate([
            {
                path: 'user',
                select: 'name email phone',
            },
            {
                path: 'clinic',
                select: 'name address clinicType isApproved isActive',
            },
        ]);

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

        if (specialization !== undefined) {
            doctor.specialization = specialization;
        }

        if (experienceYears !== undefined) {
            doctor.experienceYears = experienceYears;
        }

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
        const doctorDoc = await getOrCreateDoctorProfile(req.user._id);

        const patients = await getDoctorConsultedPatients(doctorDoc._id);

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
            return res.status(404).json({
                success: false,
                message: 'Doctor profile not found',
            });
        }

        const doctorId = doctorDoc._id;

        // 1. Total Posts
        const totalPosts = await DoctorPost.countDocuments({
            author: req.user._id,
        });

        // 2 & 3. Today's and Pending Appointments — via Scheduling facade
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];

        const {
            todayCount: todayAppointments,
            pendingCount: pendingAppointments,
        } = await getDoctorAppointmentStats(doctorId, dateString);

        // 4. Active Tokens
        let activeTokens = 0;

        if (doctorDoc.clinic) {
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);

            activeTokens = await Token.countDocuments({
                clinic: doctorDoc.clinic,
                date: todayDate,
                status: 'WAITING',
            });
        }

        res.status(200).json({
            success: true,
            totalPosts,
            todayAppointments,
            pendingAppointments,
            activeTokens,
        });
    } catch (error) {
        next(error);
    }
};