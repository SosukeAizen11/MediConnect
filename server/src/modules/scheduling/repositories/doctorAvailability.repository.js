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