import {
    approveClinic as approveClinicService,
    findClinicsForAdmin,
    countClinics,
    deleteClinicById,
    toggleClinicActivation,
} from '../modules/clinic/index.js';
import {
    findUserById,
    findUsersForAdmin,
    countUsers,
    findDoctorsByClinic,
    updateUserActiveStatus,
    deleteUserById,
} from '../modules/identity/index.js';
import { getTotalPostCount } from '../modules/posts/index.js';
import { getAppointmentStatsForAdmin } from '../modules/scheduling/index.js';
import { getTokenStatsForAdmin } from '../modules/queue/index.js';

const getClinicDoctorSummary = async (clinicId) => {
    const doctors = await findDoctorsByClinic(clinicId);
    const doctor = doctors?.[0];

    if (!doctor?.user) {
        return null;
    }

    const user = await findUserById(doctor.user);
    if (!user) {
        return null;
    }

    return { name: user.name, email: user.email };
};

// Get pending clinics (not approved)
export const getPendingClinics = async (req, res) => {
    try {
        const clinics = await findClinicsForAdmin({ isApproved: false });

        const clinicData = await Promise.all(
            clinics.map(async (clinic) => ({
                _id: clinic._id,
                name: clinic.name,
                address: clinic.address,
                clinicType: clinic.clinicType,
                createdAt: clinic.createdAt,
                doctor: await getClinicDoctorSummary(clinic._id),
            }))
        );

        res.json({
            success: true,
            count: clinicData.length,
            data: clinicData,
        });
    } catch (error) {
        console.error('Get pending clinics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Approve a clinic
export const approveClinic = async (req, res, next) => {
    try {
        const clinic = await approveClinicService(req.params.id);

        res.json({
            success: true,
            message: `Clinic "${clinic.name}" approved successfully`,
            data: clinic,
        });
    } catch (error) {
        if (error.statusCode) {
            res.status(error.statusCode);
        }

        next(error);
    }
};

// Reject or Delete a clinic
export const deleteClinic = async (req, res) => {
    try {
        const clinic = await deleteClinicById(req.params.id);

        res.json({
            success: true,
            message: `Clinic "${clinic.name}" rejected and removed`,
        });
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ message: 'Clinic not found' });
        }

        console.error('Delete clinic error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all clinics
export const getAllClinics = async (req, res) => {
    try {
        const clinics = await findClinicsForAdmin();

        const clinicData = await Promise.all(
            clinics.map(async (clinic) => ({
                _id: clinic._id,
                name: clinic.name,
                address: clinic.address,
                clinicType: clinic.clinicType,
                isApproved: clinic.isApproved,
                isActive: clinic.isActive,
                createdAt: clinic.createdAt,
                doctor: await getClinicDoctorSummary(clinic._id),
            }))
        );

        res.json({
            success: true,
            count: clinicData.length,
            data: clinicData,
        });
    } catch (error) {
        console.error('Get all clinics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Toggle clinic active status
export const toggleClinicStatus = async (req, res) => {
    try {
        const clinic = await toggleClinicActivation(req.params.id);

        res.json({
            success: true,
            message: `Clinic "${clinic.name}" is now ${clinic.isActive ? 'active' : 'inactive'}`,
            data: clinic,
        });
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ message: 'Clinic not found' });
        }

        console.error('Toggle clinic status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- USER MANAGEMENT ---

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await findUsersForAdmin();

        res.json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Toggle user active status
export const toggleUserStatus = async (req, res) => {
    try {
        const user = await findUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (req.user._id.toString() === user._id.toString()) {
            return res.status(403).json({ message: 'You cannot disable your own account' });
        }

        const updatedUser = await updateUserActiveStatus(req.params.id, !user.isActive);

        res.json({
            success: true,
            message: `User "${updatedUser.name}" is now ${updatedUser.isActive ? 'active' : 'inactive'}`,
            data: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                isActive: updatedUser.isActive,
            },
        });
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.error('Toggle user status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a user
export const deleteUser = async (req, res) => {
    try {
        const user = await findUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (req.user._id.toString() === user._id.toString()) {
            return res.status(403).json({ message: 'You cannot delete your own account' });
        }

        const deletedUser = await deleteUserById(req.params.id);

        res.json({
            success: true,
            message: `User "${deletedUser.name}" has been deleted`,
        });
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- SYSTEM ANALYTICS ---

export const getSystemAnalytics = async (req, res) => {
    try {
        const [
            totalUsers,
            totalDoctors,
            totalPatients,
            activeUsers,
            totalClinics,
            approvedClinics,
            pendingClinics,
            activeClinics,
            tokenClinics,
            appointmentClinics,
            appointmentStats,
            tokenStats,
            totalPosts,
        ] = await Promise.all([
            countUsers(),
            countUsers({ role: 'DOCTOR' }),
            countUsers({ role: 'PATIENT' }),
            countUsers({ isActive: true }),
            countClinics(),
            countClinics({ isApproved: true }),
            countClinics({ isApproved: false }),
            countClinics({ isActive: true }),
            countClinics({ clinicType: 'TOKEN' }),
            countClinics({ clinicType: 'APPOINTMENT' }),
            getAppointmentStatsForAdmin(),
            getTokenStatsForAdmin(),
            getTotalPostCount(),
        ]);

        const { totalAppointments, completedAppointments, pendingAppointments } = appointmentStats;
        const { totalTokens, activeTokens, completedTokens } = tokenStats;

        res.json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    doctors: totalDoctors,
                    patients: totalPatients,
                    active: activeUsers,
                    admins: totalUsers - totalDoctors - totalPatients,
                },
                clinics: {
                    total: totalClinics,
                    approved: approvedClinics,
                    pending: pendingClinics,
                    active: activeClinics,
                    byType: {
                        token: tokenClinics,
                        appointment: appointmentClinics,
                    }
                },
                appointments: {
                    total: totalAppointments,
                    completed: completedAppointments,
                    pending: pendingAppointments,
                },
                tokens: {
                    total: totalTokens,
                    active: activeTokens,
                    completed: completedTokens,
                },
                posts: {
                    total: totalPosts,
                }
            },
        });
    } catch (error) {
        console.error('Get system analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
