import DoctorAvailability from '../models/doctorAvailability.model.js';

export const findActiveByDoctorAndDay = async (
    doctorId,
    dayOfWeek
) => {
    return DoctorAvailability.findOne({
        doctor: doctorId,
        dayOfWeek,
        isActive: true,
    });
};

export const findActiveByDoctor = async (doctorId) => {
    return DoctorAvailability.find({
        doctor: doctorId,
        isActive: true,
    }).sort({ dayOfWeek: 1 });
};

export const findActiveByIdAndDoctor = async (id, doctorId) => {
    return DoctorAvailability.findOne({
        _id: id,
        doctor: doctorId,
        isActive: true,
    });
};

export const create = async (availabilityData) => {
    return DoctorAvailability.create(availabilityData);
};

export const save = async (availability) => {
    return availability.save();
};