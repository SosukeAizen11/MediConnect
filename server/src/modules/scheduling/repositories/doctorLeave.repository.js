import DoctorLeave from '../models/doctorLeave.model.js';

export const findByDoctorAndDate = async (doctorId, date) => {
    return DoctorLeave.findOne({
        doctor: doctorId,
        date,
    });
};

export const findByDoctor = async (doctorId) => {
    return DoctorLeave.find({
        doctor: doctorId,
    }).sort({ date: 1 });
};

export const findByIdAndDoctor = async (id, doctorId) => {
    return DoctorLeave.findOne({
        _id: id,
        doctor: doctorId,
    });
};

export const create = async (leaveData) => {
    return DoctorLeave.create(leaveData);
};

export const deleteById = async (id) => {
    return DoctorLeave.deleteOne({ _id: id });
};