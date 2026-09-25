import * as doctorRepository from '../repositories/doctor.repository.js';

export const findDoctorById = async (doctorId) => {
    return doctorRepository.findById(doctorId);
};

export const findDoctorByUserId = async (userId) => {
    return doctorRepository.findByUserId(userId);
};

export const findDoctorsByClinic = async (clinicId) => {
    return doctorRepository.findByClinic(clinicId);
};

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

export const createDoctorProfile = async (userId, profileData = {}) => {
    const existingProfile = await doctorRepository.findByUserId(userId);

    if (existingProfile) {
        const error = new Error('Doctor profile already exists for this user');
        error.statusCode = 400;
        throw error;
    }

    return doctorRepository.create({
        user: userId,
        clinic: profileData.clinic || null,
        specialization: profileData.specialization || '',
        experienceYears: profileData.experienceYears ?? 0,
    });
};

export const updateDoctorProfile = async (doctorId, profileFields = {}) => {
    const doctor = await doctorRepository.findById(doctorId);

    if (!doctor) {
        const error = new Error('Doctor profile not found');
        error.statusCode = 404;
        throw error;
    }

    const { clinic, specialization, experienceYears } = profileFields;

    if (clinic !== undefined) doctor.clinic = clinic;
    if (specialization !== undefined) doctor.specialization = specialization;
    if (experienceYears !== undefined) doctor.experienceYears = experienceYears;

    await doctor.save();

    return doctor;
};

export const linkClinicToDoctor = async (doctorId, clinicId) => {
    const doctor = await doctorRepository.findById(doctorId);

    if (!doctor) {
        const error = new Error('Doctor profile not found');
        error.statusCode = 404;
        throw error;
    }

    if (doctor.clinic) {
        const error = new Error('You already have a registered clinic');
        error.statusCode = 400;
        throw error;
    }

    return doctorRepository.linkClinic(doctorId, clinicId);
};

export const getDoctorProfileWithClinicStatus = async (userId) => {
    const doctor = await doctorRepository.findByUserId(userId);

    if (!doctor) {
        const error = new Error('Doctor profile not found');
        error.statusCode = 404;
        throw error;
    }

    await doctor.populate('clinic', 'isApproved');

    return doctor;
};
