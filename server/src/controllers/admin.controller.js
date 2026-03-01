import Clinic from '../models/clinic.model.js';
import Doctor from '../models/doctor.model.js';
import User from '../models/user.model.js';
import Appointment from '../models/appointment.model.js';
import Token from '../models/token.model.js';
import Post from '../models/post.model.js';

// Get pending clinics (not approved)
export const getPendingClinics = async (req, res) => {
    try {
        const clinics = await Clinic.find({ isApproved: false }).sort({ createdAt: -1 });

        // Get linked doctors for each clinic
        const clinicData = await Promise.all(
            clinics.map(async (clinic) => {
                const doctor = await Doctor.findOne({ clinic: clinic._id }).populate(
                    'user',
                    'name email'
                );
                return {
                    _id: clinic._id,
                    name: clinic.name,
                    address: clinic.address,
                    clinicType: clinic.clinicType,
                    createdAt: clinic.createdAt,
                    doctor: doctor?.user
                        ? { name: doctor.user.name, email: doctor.user.email }
                        : null,
                };
            })
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
export const approveClinic = async (req, res) => {
    try {
        const clinic = await Clinic.findById(req.params.id);
        if (!clinic) {
            return res.status(404).json({ message: 'Clinic not found' });
        }

        clinic.isApproved = true;
        await clinic.save();

        res.json({
            success: true,
            message: `Clinic "${clinic.name}" approved successfully`,
            data: clinic,
        });
    } catch (error) {
        console.error('Approve clinic error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Reject or Delete a clinic
export const deleteClinic = async (req, res) => {
    try {
        const clinic = await Clinic.findById(req.params.id);
        if (!clinic) {
            return res.status(404).json({ message: 'Clinic not found' });
        }

        await Clinic.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: `Clinic "${clinic.name}" rejected and removed`,
        });
    } catch (error) {
        console.error('Delete clinic error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all clinics
export const getAllClinics = async (req, res) => {
    try {
        const clinics = await Clinic.find().sort({ createdAt: -1 });

        const clinicData = await Promise.all(
            clinics.map(async (clinic) => {
                const doctor = await Doctor.findOne({ clinic: clinic._id }).populate(
                    'user',
                    'name email'
                );
                return {
                    _id: clinic._id,
                    name: clinic.name,
                    address: clinic.address,
                    clinicType: clinic.clinicType,
                    isApproved: clinic.isApproved,
                    isActive: clinic.isActive,
                    createdAt: clinic.createdAt,
                    doctor: doctor?.user
                        ? { name: doctor.user.name, email: doctor.user.email }
                        : null,
                };
            })
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
        const clinic = await Clinic.findById(req.params.id);
        if (!clinic) {
            return res.status(404).json({ message: 'Clinic not found' });
        }

        clinic.isActive = !clinic.isActive;
        await clinic.save();

        res.json({
            success: true,
            message: `Clinic "${clinic.name}" is now ${clinic.isActive ? 'active' : 'inactive'}`,
            data: clinic,
        });
    } catch (error) {
        console.error('Toggle clinic status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- USER MANAGEMENT ---

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });

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
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from disabling themselves
        if (req.user._id.toString() === user._id.toString()) {
            return res.status(403).json({ message: 'You cannot disable your own account' });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({
            success: true,
            message: `User "${user.name}" is now ${user.isActive ? 'active' : 'inactive'}`,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
            },
        });
    } catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a user
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from deleting themselves
        if (req.user._id.toString() === user._id.toString()) {
            return res.status(403).json({ message: 'You cannot delete your own account' });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: `User "${user.name}" has been deleted`,
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- SYSTEM ANALYTICS ---

export const getSystemAnalytics = async (req, res) => {
    try {
        const [
            // User Data
            totalUsers,
            totalDoctors,
            totalPatients,
            activeUsers,

            // Clinic Data
            totalClinics,
            approvedClinics,
            pendingClinics,
            activeClinics,
            tokenClinics,
            appointmentClinics,

            // Appointment Data
            totalAppointments,
            completedAppointments,
            pendingAppointments,

            // Token Data
            totalTokens,
            activeTokens,
            completedTokens,

            // Posts Data
            totalPosts,
        ] = await Promise.all([
            // Users
            User.countDocuments(),
            User.countDocuments({ role: 'DOCTOR' }),
            User.countDocuments({ role: 'PATIENT' }),
            User.countDocuments({ isActive: true }),

            // Clinics
            Clinic.countDocuments(),
            Clinic.countDocuments({ isApproved: true }),
            Clinic.countDocuments({ isApproved: false }),
            Clinic.countDocuments({ isActive: true }),
            Clinic.countDocuments({ clinicType: 'TOKEN' }),
            Clinic.countDocuments({ clinicType: 'APPOINTMENT' }),

            // Appointments
            Appointment.countDocuments(),
            Appointment.countDocuments({ status: 'COMPLETED' }),
            Appointment.countDocuments({ status: { $in: ['BOOKED', 'PENDING'] } }), // BOOKED is the default

            // Tokens
            Token.countDocuments(),
            Token.countDocuments({ status: { $in: ['WAITING', 'SERVING', 'CALLED'] } }),
            Token.countDocuments({ status: 'COMPLETED' }),

            // Posts
            Post.countDocuments(),
        ]);

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
