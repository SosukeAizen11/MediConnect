import User from '../models/user.model.js';

export const findUserByEmail = async (email) => {
    return User.findOne({ email });
};

export const findUserById = async (userId) => {
    return User.findById(userId).select('-password');
};

export const createUser = async (userData) => {
    return User.create(userData);
};