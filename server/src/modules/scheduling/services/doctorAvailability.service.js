import * as doctorAvailabilityRepository from '../repositories/doctorAvailability.repository.js';

/**
 * Creates a doctor weekly availability slot configuration.
 *
 * @param {object} params
 * @param {string} params.doctorProfileId - Canonical Doctor._id
 * @param {number} params.dayOfWeek       - 0 (Sun) to 6 (Sat)
 * @param {string} params.startTime       - "HH:MM"
 * @param {string} params.endTime         - "HH:MM"
 * @param {number} [params.slotDuration]  - Minutes per slot (default 15)
 * @returns {Promise<object>} Created DoctorAvailability document
 */
export const createAvailability = async ({
    doctorProfileId,
    dayOfWeek,
    startTime,
    endTime,
    slotDuration,
}) => {
    if (startTime >= endTime) {
        const error = new Error('End time must be after start time');
        error.statusCode = 400;
        throw error;
    }

    const existing = await doctorAvailabilityRepository.findActiveByDoctorAndDay(
        doctorProfileId,
        dayOfWeek
    );

    if (existing) {
        const error = new Error('Availability for this day already exists');
        error.statusCode = 400;
        throw error;
    }

    return doctorAvailabilityRepository.create({
        doctor: doctorProfileId,
        dayOfWeek,
        startTime,
        endTime,
        slotDuration: slotDuration || 15,
    });
};

/**
 * Retrieves all active availability configurations for a doctor.
 *
 * @param {string} doctorProfileId - Canonical Doctor._id
 * @returns {Promise<Array>}
 */
export const getMyAvailability = async (doctorProfileId) => {
    return doctorAvailabilityRepository.findActiveByDoctor(doctorProfileId);
};

/**
 * Updates an existing doctor availability configuration.
 *
 * @param {object} params
 * @param {string} params.availabilityId  - DoctorAvailability._id
 * @param {string} params.doctorProfileId - Canonical Doctor._id
 * @param {string} [params.startTime]     - "HH:MM"
 * @param {string} [params.endTime]       - "HH:MM"
 * @param {number} [params.slotDuration]  - Minutes per slot
 * @returns {Promise<object>} Updated DoctorAvailability document
 */
export const updateAvailability = async ({
    availabilityId,
    doctorProfileId,
    startTime,
    endTime,
    slotDuration,
}) => {
    const availability = await doctorAvailabilityRepository.findActiveByIdAndDoctor(
        availabilityId,
        doctorProfileId
    );

    if (!availability) {
        const error = new Error('Availability not found');
        error.statusCode = 404;
        throw error;
    }

    if (startTime && endTime) {
        if (startTime >= endTime) {
            const error = new Error('End time must be after start time');
            error.statusCode = 400;
            throw error;
        }
    } else if (startTime) {
        if (startTime >= availability.endTime) {
            const error = new Error('Start time must be before end time');
            error.statusCode = 400;
            throw error;
        }
    } else if (endTime) {
        if (availability.startTime >= endTime) {
            const error = new Error('End time must be after start time');
            error.statusCode = 400;
            throw error;
        }
    }

    availability.startTime = startTime || availability.startTime;
    availability.endTime = endTime || availability.endTime;
    if (slotDuration !== undefined) {
        availability.slotDuration = slotDuration;
    }

    return doctorAvailabilityRepository.save(availability);
};

/**
 * Soft-deletes a doctor availability configuration (sets isActive = false).
 *
 * @param {object} params
 * @param {string} params.availabilityId  - DoctorAvailability._id
 * @param {string} params.doctorProfileId - Canonical Doctor._id
 * @returns {Promise<void>}
 */
export const deleteAvailability = async ({ availabilityId, doctorProfileId }) => {
    const availability = await doctorAvailabilityRepository.findActiveByIdAndDoctor(
        availabilityId,
        doctorProfileId
    );

    if (!availability) {
        const error = new Error('Availability not found');
        error.statusCode = 404;
        throw error;
    }

    availability.isActive = false;
    await doctorAvailabilityRepository.save(availability);
};
