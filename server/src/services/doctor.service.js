import * as doctorRepository from '../repositories/doctor.repository.js';

export const getOrCreateDoctorProfile = async (userId) => {
    let doctor = await doctorRepository.findByUserId(userId);

    if (doctor) {
        return doctor;
    }

    try {
        return await doctorRepository.create({
            user: userId,
        });
    } catch (error) {
        // Another request may have created the profile
        // between our find and create operations.
        if (error.code === 11000) {
            return doctorRepository.findByUserId(userId);
        }

        throw error;
    }
};