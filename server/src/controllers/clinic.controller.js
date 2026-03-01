import Clinic from '../models/clinic.model.js';
import Doctor from '../models/doctor.model.js';

export const registerClinic = async (req, res, next) => {
    try {
        const { name, address, clinicType, workingHours } = req.body;

        if (!name || !address || !clinicType) {
            res.status(400);
            return next(new Error('Please provide all required fields'));
        }

        // Check if doctor already has a clinic
        const doctorProfile = await Doctor.findOne({ user: req.user._id });
        if (!doctorProfile) {
            res.status(404);
            return next(new Error('Doctor profile not found'));
        }

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

        // Link clinic to DoctorProfile
        doctorProfile.clinic = clinic._id;
        await doctorProfile.save();

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
