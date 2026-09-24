import Token from '../models/token.model.js';

// ─── Existing methods (preserved) ────────────────────────────────────────────

/**
 * Finds a token by ID.
 */
export const findById = async (tokenId) => {
    return Token.findById(tokenId);
};

/**
 * Saves a token document.
 */
export const save = async (token) => {
    return token.save();
};

/**
 * Finds waiting tokens for a clinic on a given date, sorted by token number.
 * Used for live waiting room queue notifications (Socket.IO payload).
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

// ─── Join queue ───────────────────────────────────────────────────────────────

/**
 * Finds an active (WAITING or CALLED) token for a patient at a clinic on a date.
 * Used to prevent duplicate queue joins.
 */
export const findByPatientAndClinicAndDate = async (patientId, clinicId, date) => {
    return Token.findOne({
        patient: patientId,
        clinic: clinicId,
        date,
        status: { $in: ['WAITING', 'CALLED'] },
    });
};

/**
 * Finds the token with the highest tokenNumber for a clinic on a given date.
 * Used to determine the next token number to assign.
 */
export const findLastByClinicAndDate = async (clinicId, date) => {
    return Token.findOne({
        clinic: clinicId,
        date,
    }).sort({ tokenNumber: -1 });
};

/**
 * Creates a new token document.
 */
export const create = async (tokenData) => {
    return Token.create(tokenData);
};

/**
 * Counts WAITING tokens for a clinic on a date with a tokenNumber less than the given value.
 * Used to calculate how many tokens are ahead in the queue after joining.
 */
export const countWaitingBeforeNumber = async (clinicId, date, tokenNumber) => {
    return Token.countDocuments({
        clinic: clinicId,
        date,
        tokenNumber: { $lt: tokenNumber },
        status: 'WAITING',
    });
};

// ─── Current serving / Socket.IO ─────────────────────────────────────────────

/**
 * Finds the currently CALLED token for a clinic on a date, populated with patient info.
 * Used in getDoctorQueue, getMyToken, and Socket.IO payloads.
 */
export const findCalledByClinicAndDate = async (clinicId, date) => {
    return Token.findOne({
        clinic: clinicId,
        date,
        status: 'CALLED',
    })
        .populate('patient', 'name email phone')
        .sort({ tokenNumber: 1 });
};

/**
 * Finds the currently CALLED token for a clinic on a date without population.
 * Used in advanceToken to mark the current token as COMPLETED.
 */
export const findCalledRawByClinicAndDate = async (clinicId, date) => {
    return Token.findOne({
        clinic: clinicId,
        date,
        status: 'CALLED',
    });
};

// ─── Patient token queries ────────────────────────────────────────────────────

/**
 * Finds all tokens for a patient on or after a given date, with clinic info populated.
 * Used by getPatientTokens.
 */
export const findByPatientFromDate = async (patientId, fromDate) => {
    return Token.find({
        patient: patientId,
        date: { $gte: fromDate },
    })
        .populate('clinic', 'name address')
        .sort({ createdAt: -1 });
};

/**
 * Finds a patient's active (WAITING or CALLED) token for today, with clinic info populated.
 * Used by getMyToken.
 */
export const findActiveByPatientAndDate = async (patientId, date) => {
    return Token.findOne({
        patient: patientId,
        date,
        status: { $in: ['WAITING', 'CALLED'] },
    }).populate('clinic', 'name address');
};

/**
 * Finds the most recently completed token for a clinic on a date.
 * Used as a fallback when no token is currently CALLED, to determine the last served number.
 */
export const findLastCompletedByClinicAndDate = async (clinicId, date) => {
    return Token.findOne({
        clinic: clinicId,
        date,
        status: 'COMPLETED',
    }).sort({ tokenNumber: -1 });
};

/**
 * Counts WAITING tokens ahead of a patient's token number for a clinic on a date.
 * Used by getMyToken to calculate estimated wait.
 */
export const countTokensAheadForPatient = async (clinicId, date, tokenNumber) => {
    return Token.countDocuments({
        clinic: clinicId,
        date,
        tokenNumber: { $lt: tokenNumber },
        status: 'WAITING',
    });
};

// ─── Doctor queue queries ─────────────────────────────────────────────────────

/**
 * Counts COMPLETED tokens for a clinic on a date.
 * Used in getDoctorQueue and advanceToken to show completed count.
 */
export const countCompletedByClinicAndDate = async (clinicId, date) => {
    return Token.countDocuments({
        clinic: clinicId,
        date,
        status: 'COMPLETED',
    });
};

/**
 * Finds the next WAITING token (lowest tokenNumber) for a clinic on a date.
 * Used in advanceToken to call the next patient.
 */
export const findNextWaitingByClinicAndDate = async (clinicId, date) => {
    return Token.findOne({
        clinic: clinicId,
        date,
        status: 'WAITING',
    }).sort({ tokenNumber: 1 });
};

/**
 * Finds a token by ID with patient details populated.
 * Used in advanceToken after marking a token as CALLED.
 */
export const findByIdPopulatedPatient = async (tokenId) => {
    return Token.findById(tokenId).populate('patient', 'name email phone');
};

// ─── Token details ────────────────────────────────────────────────────────────

/**
 * Finds a token by ID with full patient profile and clinic details populated.
 * Used by getTokenDetails for the doctor consultation view.
 */
export const findByIdWithDetails = async (tokenId) => {
    return Token.findById(tokenId)
        .populate(
            'patient',
            'name email phone gender dateOfBirth address emergencyContact'
        )
        .populate('clinic', 'name address');
};

// ─── Analytics / dashboard counts ─────────────────────────────────────────────

/**
 * Returns total count of all tokens across the system.
 * Used by admin platform analytics.
 */
export const countAll = async () => {
    return Token.countDocuments();
};

/**
 * Returns count of tokens matching any of the given status values.
 * Used by admin platform analytics (active / completed aggregates).
 *
 * @param {Array<string>} statuses
 * @returns {Promise<number>}
 */
export const countByStatuses = async (statuses) => {
    return Token.countDocuments({
        status: { $in: statuses },
    });
};

/**
 * Counts WAITING tokens for a clinic on a given date.
 * Used by the doctor dashboard active-tokens KPI.
 *
 * @param {string|object} clinicId
 * @param {Date} date
 * @returns {Promise<number>}
 */
export const countWaitingByClinicAndDate = async (clinicId, date) => {
    return Token.countDocuments({
        clinic: clinicId,
        date,
        status: 'WAITING',
    });
};
