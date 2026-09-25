import {
    getPatientProfileData,
    updatePatientProfileData,
    getPatientDashboardSummary,
} from '../services/patient.service.js';

export const getProfile = async (req, res) => {
    try {
        const data = await getPatientProfileData(req.user.id);

        res.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('Get profile error:', error);
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Server error';
        res.status(statusCode).json({ message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { fullName, phone, gender, dateOfBirth, address, emergencyContact } = req.body;

        const data = await updatePatientProfileData(req.user.id, {
            fullName,
            phone,
            gender,
            dateOfBirth,
            address,
            emergencyContact,
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data,
        });
    } catch (error) {
        console.error('Update profile error:', error);
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Server error';
        res.status(statusCode).json({ message });
    }
};

export const getDashboardStats = async (req, res) => {
    try {
        const patientId = req.user._id;
        const { kpiData, upcomingAppointments } = await getPatientDashboardSummary(patientId);

        res.status(200).json({
            success: true,
            kpiData,
            upcomingAppointments,
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
