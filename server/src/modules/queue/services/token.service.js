import { getIO } from '../../../socket.js';
import * as tokenRepository from '../repositories/token.repository.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns today's date normalised to midnight (00:00:00.000).
 */
const todayMidnight = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Emits a token:update event to the clinic's Socket.IO room.
 * Non-blocking — errors are logged but do not propagate.
 *
 * @param {string|object} clinicId
 * @param {object|null}   currentToken  - The currently CALLED token document (populated)
 * @param {Array}         waitingTokens - Waiting token documents (populated)
 */
const emitQueueUpdate = async (clinicId, currentToken, waitingTokens) => {
    try {
        const io = getIO();
        io.to(`clinic:${clinicId.toString()}`).emit('token:update', {
            currentToken: currentToken || null,
            waitingTokens,
        });
    } catch (socketError) {
        console.error('Socket emission error:', socketError);
    }
};

// ─── Patient operations ───────────────────────────────────────────────────────

/**
 * Joins a patient to the token queue for a clinic.
 *
 * Business rules:
 * - Clinic must exist and be TOKEN type (validated by caller — controller owns Clinic lookup).
 * - Patient may not hold more than one active token per clinic per day.
 * - Token numbers are sequential per clinic per day starting at 1.
 * - Emits token:update to the clinic room after joining.
 *
 * @param {object} params
 * @param {string} params.patientId
 * @param {string} params.clinicId
 * @param {string} params.clinicName - Used only for Socket.IO emission context (not stored)
 * @returns {Promise<{ tokenNumber: number, tokensAhead: number }>}
 */
export const joinQueue = async ({ patientId, clinicId }) => {
    const today = todayMidnight();

    // Duplicate check
    const existingToken = await tokenRepository.findByPatientAndClinicAndDate(
        patientId,
        clinicId,
        today
    );

    if (existingToken) {
        const error = new Error(
            'You already have an active token for this clinic today'
        );
        error.statusCode = 400;
        error.tokenNumber = existingToken.tokenNumber;
        throw error;
    }

    // Determine next token number
    const lastToken = await tokenRepository.findLastByClinicAndDate(clinicId, today);
    const nextTokenNumber = lastToken ? lastToken.tokenNumber + 1 : 1;

    // Create token
    await tokenRepository.create({
        patient: patientId,
        clinic: clinicId,
        tokenNumber: nextTokenNumber,
        date: today,
    });

    // Count tokens ahead
    const tokensAhead = await tokenRepository.countWaitingBeforeNumber(
        clinicId,
        today,
        nextTokenNumber
    );

    // Emit live queue update
    const [waitingTokens, currentServing] = await Promise.all([
        tokenRepository.findWaitingByClinicAndDate(clinicId, today),
        tokenRepository.findCalledByClinicAndDate(clinicId, today),
    ]);

    await emitQueueUpdate(clinicId, currentServing, waitingTokens);

    return { tokenNumber: nextTokenNumber, tokensAhead };
};

/**
 * Returns all tokens for a patient on or after today (future + today).
 *
 * @param {string} patientId
 * @returns {Promise<Array>}
 */
export const getPatientTokens = async (patientId) => {
    const today = todayMidnight();
    return tokenRepository.findByPatientFromDate(patientId, today);
};

/**
 * Returns the patient's current active token for today with full queue status.
 * Returns { hasActiveToken: false, data: null } when no active token exists.
 *
 * @param {string} patientId
 * @returns {Promise<{ hasActiveToken: boolean, data: object|null }>}
 */
export const getMyToken = async (patientId) => {
    const today = todayMidnight();

    const token = await tokenRepository.findActiveByPatientAndDate(patientId, today);

    if (!token) {
        return { hasActiveToken: false, data: null };
    }

    // Determine the currently serving token number
    const calledToken = await tokenRepository.findCalledRawByClinicAndDate(
        token.clinic._id,
        today
    );

    let currentToken = 0;

    if (calledToken) {
        currentToken = calledToken.tokenNumber;
    } else {
        const lastCompleted = await tokenRepository.findLastCompletedByClinicAndDate(
            token.clinic._id,
            today
        );
        currentToken = lastCompleted ? lastCompleted.tokenNumber : 0;
    }

    const tokensAhead = await tokenRepository.countTokensAheadForPatient(
        token.clinic._id,
        today,
        token.tokenNumber
    );

    return {
        hasActiveToken: true,
        data: {
            tokenNumber: token.tokenNumber,
            clinicId: token.clinic._id,
            clinicName: token.clinic.name,
            clinicAddress: token.clinic.address,
            currentToken,
            tokensAhead,
            status: token.status,
            estimatedWait: `${tokensAhead * 10} minutes`,
        },
    };
};

// ─── Doctor operations ────────────────────────────────────────────────────────

/**
 * Returns the full token queue state for a doctor's clinic.
 *
 * @param {string|object} clinicId  - Clinic ObjectId
 * @param {string}        clinicName
 * @returns {Promise<{ clinicName: string, currentToken: object|null, waitingTokens: Array, waitingCount: number, completedCount: number }>}
 */
export const getDoctorQueue = async (clinicId, clinicName) => {
    const today = todayMidnight();

    const [currentToken, waitingTokens, completedCount] = await Promise.all([
        tokenRepository.findCalledByClinicAndDate(clinicId, today),
        tokenRepository.findWaitingByClinicAndDate(clinicId, today),
        tokenRepository.countCompletedByClinicAndDate(clinicId, today),
    ]);

    return {
        clinicName,
        currentToken: currentToken || null,
        waitingTokens,
        waitingCount: waitingTokens.length,
        completedCount,
    };
};

/**
 * Advances the token queue:
 * 1. Marks the currently CALLED token as COMPLETED (if one exists).
 * 2. Calls the next WAITING token (lowest tokenNumber).
 * 3. Emits token:update to the clinic room.
 * 4. Returns the updated queue state.
 *
 * @param {string|object} clinicId   - Clinic ObjectId
 * @param {string}        clinicName
 * @returns {Promise<{ message: string, data: object }>}
 */
export const advanceToken = async (clinicId, clinicName) => {
    const today = todayMidnight();

    // Mark current CALLED token as COMPLETED
    const currentServing = await tokenRepository.findCalledRawByClinicAndDate(clinicId, today);
    if (currentServing) {
        currentServing.status = 'COMPLETED';
        await tokenRepository.save(currentServing);
    }

    // Call next WAITING token
    const nextToken = await tokenRepository.findNextWaitingByClinicAndDate(clinicId, today);
    if (nextToken) {
        nextToken.status = 'CALLED';
        await tokenRepository.save(nextToken);
    }

    // Build updated queue state
    const updatedCurrentToken = nextToken
        ? await tokenRepository.findByIdPopulatedPatient(nextToken._id)
        : null;

    const [waitingTokens, completedCount] = await Promise.all([
        tokenRepository.findWaitingByClinicAndDate(clinicId, today),
        tokenRepository.countCompletedByClinicAndDate(clinicId, today),
    ]);

    // Emit live queue update
    await emitQueueUpdate(clinicId, updatedCurrentToken, waitingTokens);

    return {
        message: nextToken
            ? `Now serving Token #${nextToken.tokenNumber}`
            : 'No more patients in queue',
        data: {
            clinicName,
            currentToken: updatedCurrentToken || null,
            waitingTokens,
            waitingCount: waitingTokens.length,
            completedCount,
        },
    };
};

/**
 * Returns a fully populated token document for the doctor consultation view.
 * Verifies the token belongs to the doctor's clinic.
 *
 * NOTE: Clinical data (consultation record + history) is intentionally NOT fetched here.
 * Queue must not depend on Clinical. The controller fetches clinical data via the Clinical
 * facade and composes the full response.
 *
 * @param {object} params
 * @param {string} params.tokenId        - Token._id
 * @param {string} params.doctorClinicId - Clinic ObjectId from doctor profile
 * @returns {Promise<object>} Populated token document
 */
export const getTokenDetails = async ({ tokenId, doctorClinicId }) => {
    const token = await tokenRepository.findByIdWithDetails(tokenId);

    if (!token) {
        const error = new Error('Token not found');
        error.statusCode = 404;
        throw error;
    }

    if (
        !doctorClinicId ||
        token.clinic._id.toString() !== doctorClinicId.toString()
    ) {
        const error = new Error('Not authorized to view this token');
        error.statusCode = 403;
        throw error;
    }

    return token;
};

// ─── Clinical integration (called by Clinical module via Queue facade) ─────────

/**
 * Verifies that a token exists, belongs to the doctor's clinic, and is in CALLED (serving) state.
 * Does NOT mutate status.
 *
 * @param {object} params
 * @param {string} params.tokenId        - Token._id
 * @param {string} params.doctorClinicId - Clinic ObjectId from doctor profile
 * @returns {Promise<object>} Token document
 */
export const getTokenForConsultation = async ({ tokenId, doctorClinicId }) => {
    const token = await tokenRepository.findById(tokenId);
    if (!token) {
        const error = new Error('Token not found');
        error.statusCode = 404;
        throw error;
    }

    if (!doctorClinicId || token.clinic.toString() !== doctorClinicId.toString()) {
        const error = new Error('Not authorized to update this token');
        error.statusCode = 403;
        throw error;
    }

    if (token.status !== 'CALLED') {
        const error = new Error('Can only complete a CALLED (serving) token');
        error.statusCode = 400;
        throw error;
    }

    return token;
};

/**
 * Completes a token queue item:
 * 1. Verifies token is CALLED and authorized.
 * 2. Updates status to COMPLETED.
 * 3. Emits real-time Socket.IO update to the clinic's waiting room.
 *
 * @param {object} params
 * @param {string} params.tokenId        - Token._id
 * @param {string} params.doctorClinicId - Clinic ObjectId from doctor profile
 * @returns {Promise<object>} Completed token document
 */
export const completeToken = async ({ tokenId, doctorClinicId }) => {
    const token = await tokenRepository.findById(tokenId);
    if (!token) {
        const error = new Error('Token not found');
        error.statusCode = 404;
        throw error;
    }

    if (!doctorClinicId || token.clinic.toString() !== doctorClinicId.toString()) {
        const error = new Error('Not authorized to update this token');
        error.statusCode = 403;
        throw error;
    }

    if (token.status !== 'CALLED') {
        const error = new Error('Can only complete a CALLED (serving) token');
        error.statusCode = 400;
        throw error;
    }

    token.status = 'COMPLETED';
    await tokenRepository.save(token);

    // Emit real-time queue update
    const today = todayMidnight();
    const clinicId = doctorClinicId || token.clinic;
    const waitingTokens = await tokenRepository.findWaitingByClinicAndDate(clinicId, today);

    await emitQueueUpdate(clinicId, null, waitingTokens);

    return token;
};
