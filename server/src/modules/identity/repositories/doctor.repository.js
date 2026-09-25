import Doctor from '../models/doctor.model.js';

export const findById = async (doctorId) => {
    return Doctor.findById(doctorId);
};

export const findByUserId = async (userId) => {
    return Doctor.findOne({ user: userId });
};

export const findByClinic = async (clinicId) => {
    return Doctor.find({ clinic: clinicId });
};

export const create = async (doctorData) => {
    return Doctor.create(doctorData);
};

export const updateById = async (doctorId, updateData) => {
    return Doctor.findByIdAndUpdate(
        doctorId,
        updateData,
        { new: true }
    );
};

export const linkClinic = async (doctorId, clinicId) => {
    return Doctor.findByIdAndUpdate(
        doctorId,
        { clinic: clinicId },
        { new: true }
    );
};
