import * as doctorLeaveRepository from '../repositories/doctorLeave.repository.js';

/**
 * Retrieves all leaves registered for a doctor, sorted by date ascending.
 *
 * @param {string} doctorProfileId - Canonical Doctor._id
 * @returns {Promise<Array>}
 */
export const getMyLeaves = async (doctorProfileId) => {
    return doctorLeaveRepository.findByDoctor(doctorProfileId);
};

/**
 * Creates a leave record for a doctor on a specific date.
 *
 * @param {object} params
 * @param {string} params.doctorProfileId - Canonical Doctor._id
 * @param {string} params.date            - "YYYY-MM-DD"
 * @param {string} [params.reason]        - Optional reason
 * @returns {Promise<object>} Created DoctorLeave document
 */
export const createLeave = async ({ doctorProfileId, date, reason }) => {
    if (!date) {
        const error = new Error('Date is required');
        error.statusCode = 400;
        throw error;
    }

    const existing = await doctorLeaveRepository.findByDoctorAndDate(
        doctorProfileId,
        date
    );

    if (existing) {
        const error = new Error('Leave already exists for this date');
        error.statusCode = 400;
        throw error;
    }

    return doctorLeaveRepository.create({
        doctor: doctorProfileId,
        date,
        reason: reason || '',
    });
};

/**
 * Deletes a doctor leave record.
 *
 * @param {object} params
 * @param {string} params.leaveId         - DoctorLeave._id
 * @param {string} params.doctorProfileId - Canonical Doctor._id
 * @returns {Promise<void>}
 */
export const deleteLeave = async ({ leaveId, doctorProfileId }) => {
    const leave = await doctorLeaveRepository.findByIdAndDoctor(
        leaveId,
        doctorProfileId
    );

    if (!leave) {
        const error = new Error('Leave not found');
        error.statusCode = 404;
        throw error;
    }

    await doctorLeaveRepository.deleteById(leaveId);
};
