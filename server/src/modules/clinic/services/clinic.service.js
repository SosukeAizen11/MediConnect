import Clinic from '../models/clinic.model.js';

/**
 * Retrieves a clinic by ID.
 * Returns null when the clinic does not exist so callers can apply their own
 * not-found / type-validation handling without changing existing HTTP contracts.
 *
 * @param {string|object} clinicId - Clinic._id
 * @returns {Promise<object|null>}
 */
export const getClinicById = async (clinicId) => {
    return Clinic.findById(clinicId);
};

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

/**
 * Creates a clinic in the unapproved, active state used by doctor registration.
 *
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.address
 * @param {string} params.clinicType
 * @param {string} [params.workingHours]
 * @param {string|object} params.createdBy - Doctor._id
 * @returns {Promise<object>} Created Clinic document
 */
export const createClinic = async ({
    name,
    address,
    clinicType,
    workingHours,
    createdBy,
}) => {
    return Clinic.create({
        name,
        address,
        clinicType,
        workingHours,
        isApproved: false,
        isActive: true,
        createdBy,
    });
};

/**
 * Lists clinics that are both approved and active (public clinic directory).
 *
 * @returns {Promise<Array>}
 */
export const findApprovedActiveClinics = async () => {
    return Clinic.find({ isApproved: true, isActive: true });
};
