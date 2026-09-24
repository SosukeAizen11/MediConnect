import User from '../modules/identity/models/user.model.js';
import Report from '../models/report.model.js';
import { getPatientDashboardData } from '../modules/scheduling/index.js';

// Get patient profile
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            success: true,
            data: {
                fullName: user.name,
                email: user.email,
                phone: user.phone || '',
                gender: user.gender || '',
                dateOfBirth: user.dateOfBirth || null,
                address: user.address || '',
                emergencyContact: user.emergencyContact || '',
            },
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update patient profile
export const updateProfile = async (req, res) => {
    try {
        const { fullName, phone, gender, dateOfBirth, address, emergencyContact } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields
        if (fullName) user.name = fullName;
        if (phone !== undefined) user.phone = phone;
        if (gender !== undefined) user.gender = gender;
        if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth || null;
        if (address !== undefined) user.address = address;
        if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                fullName: user.name,
                email: user.email,
                phone: user.phone || '',
                gender: user.gender || '',
                dateOfBirth: user.dateOfBirth || null,
                address: user.address || '',
                emergencyContact: user.emergencyContact || '',
            },
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get dashboard stats
export const getDashboardStats = async (req, res) => {
    try {
        const patientId = req.user._id;

        // Appointment data — via Scheduling facade (total, upcoming count, upcoming list)
        const todayString = new Date().toISOString().split('T')[0];
        const {
            totalCount: totalAppointments,
            upcomingCount: upcomingAppointments,
            upcomingList: formattedAppointments,
        } = await getPatientDashboardData(patientId, todayString);

        // 3. Medical Records
        const medicalRecords = await Report.countDocuments({ patient: patientId });

        // 4. Notifications
        const notifications = 0; // Placeholder as Notifications model does not exist

        res.status(200).json({
            success: true,
            kpiData: {
                totalAppointments,
                upcomingAppointments,
                medicalRecords,
                notifications
            },
            upcomingAppointments: formattedAppointments
        });

    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
