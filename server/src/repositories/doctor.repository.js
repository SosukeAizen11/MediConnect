import Doctor from '../models/doctor.model.js';

export const findById = async (doctorId) => {
    return Doctor.findById(doctorId);
};

export const findByUserId = async (userId) => {
    return Doctor.findOne({ user: userId });
};

export const create = async (doctorData) => {
    return Doctor.create(doctorData);
};