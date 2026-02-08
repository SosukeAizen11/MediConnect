import User from '../models/user.model.js';

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
