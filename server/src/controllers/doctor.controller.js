import Doctor from '../models/doctor.model.js';
import Clinic from '../models/clinic.model.js';

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
