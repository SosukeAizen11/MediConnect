import Clinic from '../models/clinic.model.js';
import { approveClinic as approveClinicService } from '../services/clinic.service.js';
import {
    getOrCreateDoctorProfile,
    linkClinicToDoctor,
} from '../modules/identity/index.js';

export const registerClinic = async (req, res, next) => {
    try {
        const { name, address, clinicType, workingHours } = req.body;

        if (!name || !address || !clinicType) {
            res.status(400);
            return next(new Error('Please provide all required fields'));
        }

        const doctorProfile = await getOrCreateDoctorProfile(req.user._id);

        if (doctorProfile.clinic) {
            res.status(400);
            return next(new Error('You already have a registered clinic'));
        }

        const clinic = await Clinic.create({
            name,
            address,
            clinicType,
            workingHours,
            isApproved: false,
            isActive: true,
            createdBy: doctorProfile._id,
        });

        await linkClinicToDoctor(doctorProfile._id, clinic._id);

        res.status(201).json({
            success: true,
            message: 'Clinic submitted for approval',
            data: clinic,
        });
    } catch (error) {
        next(error);
    }
};

export const getApprovedClinics = async (req, res, next) => {
    try {
        const clinics = await Clinic.find({ isApproved: true, isActive: true });

        res.status(200).json({
            success: true,
            count: clinics.length,
            data: clinics,
        });
    } catch (error) {
        next(error);
    }
};

export const getClinicById = async (req, res, next) => {
    try {
        const clinic = await Clinic.findById(req.params.id);

        if (!clinic) {
            res.status(404);
            return next(new Error('Clinic not found'));
        }

        res.status(200).json({
            success: true,
            data: clinic,
        });
    } catch (error) {
        next(error);
    }
};

export const approveClinic = async (req, res, next) => {
    try {
        const clinic = await approveClinicService(req.params.id);

        res.status(200).json({
            success: true,
            data: clinic,
        });
    } catch (error) {
        if (error.statusCode) {
            res.status(error.statusCode);
        }
        next(error);
    }
};
