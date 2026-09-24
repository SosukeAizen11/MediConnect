import { getDoctorProfileWithClinicStatus } from '../modules/identity/index.js';

export const requireApprovedClinic = async (req, res, next) => {
    try {
        const doctor = await getDoctorProfileWithClinicStatus(req.user._id);

        if (!doctor.clinic) {
            return res.status(403).json({
                success: false,
                message: 'Clinic registration and approval is required',
            });
        }

        if (!doctor.clinic.isApproved) {
            return res.status(403).json({
                success: false,
                message: 'Clinic approval is required for this action',
            });
        }

        next();
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(403).json({
                success: false,
                message: 'Doctor profile not found',
            });
        }

        next(error);
    }
};