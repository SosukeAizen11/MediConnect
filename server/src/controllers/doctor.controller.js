import { getPostCountByAuthor } from '../modules/posts/index.js';
import { getDoctorAppointmentStats } from '../modules/scheduling/index.js';
import { getDoctorConsultedPatients } from '../modules/clinical/index.js';
import { countWaitingTokensByClinic } from '../modules/queue/index.js';

import {
    getOrCreateDoctorProfile,
    findDoctorById,
    findDoctorByUserId,
    findDoctorsByClinic,
    createDoctorProfile as createDoctorIdentityProfile,
    updateDoctorProfile as updateDoctorIdentityProfile,
} from '../modules/identity/index.js';
import { getClinicById } from '../modules/clinic/index.js';

export const createDoctorProfile = async (req, res, next) => {
    try {
        const { clinic, specialization, experienceYears } = req.body;

        if (!clinic || !specialization) {
            res.status(400);
            return next(new Error('Please provide clinic and specialization'));
        }

        const existingProfile = await findDoctorByUserId(req.user._id);
        if (existingProfile) {
            res.status(400);
            return next(new Error('Doctor profile already exists for this user'));
        }

        const clinicDoc = await getClinicById(clinic);
        if (!clinicDoc) {
            res.status(404);
            return next(new Error('Clinic not found'));
        }

        if (!clinicDoc.isApproved) {
            res.status(400);
            return next(new Error('Cannot create profile for unapproved clinic'));
        }

        const doctor = await createDoctorIdentityProfile(req.user._id, {
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

        const doctor = await findDoctorByUserId(req.user._id);

        if (!doctor) {
            res.status(404);
            return next(new Error('Doctor profile not found'));
        }

        if (clinic) {
            const clinicDoc = await getClinicById(clinic);

            if (!clinicDoc) {
                res.status(404);
                return next(new Error('Clinic not found'));
            }

            if (!clinicDoc.isApproved) {
                res.status(400);
                return next(new Error('Cannot link to unapproved clinic'));
            }
        }

        const updated = await updateDoctorIdentityProfile(doctor._id, {
            clinic,
            specialization,
            experienceYears,
        });

        const populated = await findDoctorById(updated._id)
            .populate('user', 'name email phone')
            .populate('clinic', 'name address clinicType');

        res.status(200).json({
            success: true,
            data: populated,
        });
    } catch (error) {
        next(error);
    }
};

export const getDoctorsByClinic = async (req, res, next) => {
    try {
        const { clinicId } = req.params;

        const doctors = await findDoctorsByClinic(clinicId);
        const populatedDoctors = await Promise.all(
            doctors.map(async (doctor) => {
                await doctor.populate('user', 'name email');
                await doctor.populate('clinic', 'name address');
                return doctor;
            })
        );

        res.status(200).json({
            success: true,
            count: populatedDoctors.length,
            data: populatedDoctors,
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
        const doctorDoc = await findDoctorByUserId(req.user._id);

        if (!doctorDoc) {
            return res.status(404).json({
                success: false,
                message: 'Doctor profile not found',
            });
        }

        const doctorId = doctorDoc._id;

        // 1. Total Posts
        const totalPosts = await getPostCountByAuthor(req.user._id);

        // 2 & 3. Today's and Pending Appointments — via Scheduling facade
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];

        const {
            todayCount: todayAppointments,
            pendingCount: pendingAppointments,
        } = await getDoctorAppointmentStats(doctorId, dateString);

        // 4. Active Tokens — via Queue facade
        let activeTokens = 0;

        if (doctorDoc.clinic) {
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);

            activeTokens = await countWaitingTokensByClinic(
                doctorDoc.clinic,
                todayDate
            );
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