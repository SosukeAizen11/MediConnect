import { getIO } from '../../../socket.js';
import * as tokenRepository from '../repositories/token.repository.js';

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

    // Emit real-time queue update (Queue concern)
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const clinicIdStr = (doctorClinicId || token.clinic).toString();
        const io = getIO();
        const waitingTokens = await tokenRepository.findWaitingByClinicAndDate(
            doctorClinicId || token.clinic,
            today
        );

        io.to(`clinic:${clinicIdStr}`).emit('token:update', {
            currentToken: null,
            waitingTokens,
        });
    } catch (socketError) {
        console.error('Socket emission error:', socketError);
    }

    return token;
};
