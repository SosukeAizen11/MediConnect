import Token from '../../../models/token.model.js';

/**
 * Finds a token by ID.
 *
 * @param {string} tokenId
 * @returns {Promise<object|null>}
 */
export const findById = async (tokenId) => {
    return Token.findById(tokenId);
};

/**
 * Saves a token document.
 *
 * @param {object} token
 * @returns {Promise<object>}
 */
export const save = async (token) => {
    return token.save();
};


/**
 * Finds waiting tokens for a clinic on a given date, sorted by token number.
 * Used for live waiting room queue notifications.
 *
 * @param {string} clinicId
 * @param {Date} date - Midnight date
 * @returns {Promise<Array>}
 */
export const findWaitingByClinicAndDate = async (clinicId, date) => {
    return Token.find({
        clinic: clinicId,
        date,
        status: 'WAITING',
    })
        .populate('patient', 'name email phone')
        .sort({ tokenNumber: 1 });
};
