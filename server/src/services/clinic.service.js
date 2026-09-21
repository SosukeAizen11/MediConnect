import Clinic from '../models/clinic.model.js';

/**
 * Approves a clinic by setting isApproved = true.
 *
 * Throws a structured error with statusCode 404 if the clinic does not exist,
 * so callers can map the error to the appropriate HTTP response.
 *
 * @param {string} clinicId - Clinic._id
 * @returns {Promise<object>} Updated Clinic document
 */
export const approveClinic = async (clinicId) => {
    const clinic = await Clinic.findById(clinicId);

    if (!clinic) {
        const error = new Error('Clinic not found');
        error.statusCode = 404;
        throw error;
    }

    clinic.isApproved = true;
    await clinic.save();

    return clinic;
};
