import User from '../models/user.model.js';
import Appointment from '../models/appointment.model.js';
import Report from '../models/report.model.js';

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

        // Date format is YYYY-MM-DD string
        const todayString = new Date().toISOString().split('T')[0];

        // 1. Total Appointments
        const totalAppointments = await Appointment.countDocuments({ patient: patientId });

        // 2. Upcoming Appointments (count)
        const upcomingAppointments = await Appointment.countDocuments({
            patient: patientId,
            status: { $in: ['BOOKED', 'CONFIRMED'] },
            date: { $gte: todayString }
        });

        // 3. Medical Records
        const medicalRecords = await Report.countDocuments({ patient: patientId });

        // 4. Notifications
        const notifications = 0; // Placeholder as Notifications model does not exist

        // Fetch upcoming appointments list
        const upcomingAppointmentsList = await Appointment.find({
            patient: patientId,
            status: { $in: ['BOOKED', 'CONFIRMED'] },
            date: { $gte: todayString }
        })
            .populate('doctor', 'user')
            .populate({
                path: 'doctor',
                populate: {
                    path: 'user',
                    select: 'name'
                }
            })
            .populate('clinic', 'name')
            .sort({ date: 1, time: 1 })
            .limit(5);

        // Format appointments list
        const formattedAppointments = upcomingAppointmentsList.map(apt => ({
            doctorName: apt.doctor?.user?.name || 'Unknown Doctor',
            clinicName: apt.clinic?.name || 'Unknown Clinic',
            date: apt.date,
            time: apt.time
        }));

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
