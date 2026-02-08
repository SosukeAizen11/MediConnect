import Clinic from '../models/clinic.model.js';

export const registerClinic = async (req, res, next) => {
    try {
        const { name, address, clinicType } = req.body;

        if (!name || !address || !clinicType) {
            res.status(400);
            return next(new Error('Please provide all required fields'));
        }

        const clinic = await Clinic.create({
            name,
            address,
            clinicType,
        });

        res.status(201).json({
            success: true,
            data: clinic,
        });
    } catch (error) {
        next(error);
    }
};

export const getApprovedClinics = async (req, res, next) => {
    try {
        const clinics = await Clinic.find({ isApproved: true });

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
        const clinic = await Clinic.findById(req.params.id);

        if (!clinic) {
            res.status(404);
            return next(new Error('Clinic not found'));
        }

        clinic.isApproved = true;
        await clinic.save();

        res.status(200).json({
            success: true,
            data: clinic,
        });
    } catch (error) {
        next(error);
    }
};
