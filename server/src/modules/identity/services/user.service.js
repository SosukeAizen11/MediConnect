import User from '../models/user.model.js';

export const findUserByEmail = async (email) => {
    return User.findOne({ email });
};

export const findUserById = async (userId) => {
    return User.findById(userId).select('-password');
};

export const findUsersForAdmin = async () => {
    return User.find().select('-password').sort({ createdAt: -1 });
};

export const countUsers = async (filters = {}) => {
    return User.countDocuments(filters);
};

export const createUser = async (userData) => {
    return User.create(userData);
};

export const updateUserProfile = async (userId, profileFields = {}) => {
    const user = await User.findById(userId);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    const {
        fullName,
        phone,
        gender,
        dateOfBirth,
        address,
        emergencyContact,
    } = profileFields;

    if (fullName !== undefined) user.name = fullName;
    if (phone !== undefined) user.phone = phone;
    if (gender !== undefined) user.gender = gender;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth || null;
    if (address !== undefined) user.address = address;
    if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;

    await user.save();

    return user;
};

export const updateUserActiveStatus = async (userId, isActive) => {
    const user = await User.findById(userId);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    user.isActive = isActive;
    await user.save();

    return user;
};

export const deleteUserById = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    await User.findByIdAndDelete(userId);
    return user;
};