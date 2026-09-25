import { findUserById, updateUserProfile } from '../../identity/index.js';
import { getPatientDashboardData } from '../../scheduling/index.js';
import { getPatientReportCount } from '../../reports/index.js';

const serializeProfile = (user) => ({
    fullName: user.name,
    email: user.email,
    phone: user.phone || '',
    gender: user.gender || '',
    dateOfBirth: user.dateOfBirth || null,
    address: user.address || '',
    emergencyContact: user.emergencyContact || '',
});

export const getPatientProfileData = async (userId) => {
    const user = await findUserById(userId);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return serializeProfile(user);
};

export const updatePatientProfileData = async (userId, profileFields = {}) => {
    const user = await updateUserProfile(userId, profileFields);
    return serializeProfile(user);
};

export const getPatientDashboardSummary = async (patientId) => {
    const todayString = new Date().toISOString().split('T')[0];
    const {
        totalCount: totalAppointments,
        upcomingCount: upcomingAppointments,
        upcomingList: formattedAppointments,
    } = await getPatientDashboardData(patientId, todayString);

    const medicalRecords = await getPatientReportCount(patientId);

    return {
        kpiData: {
            totalAppointments,
            upcomingAppointments,
            medicalRecords,
            notifications: 0,
        },
        upcomingAppointments: formattedAppointments,
    };
};
