import DoctorLeave from '../models/doctorLeave.model.js';

export const findByDoctorAndDate = async (doctorId, date) => {
    return DoctorLeave.findOne({
        doctor: doctorId,
        date,
    });
};