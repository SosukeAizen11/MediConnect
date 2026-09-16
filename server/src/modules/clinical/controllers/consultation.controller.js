import { getPatientConsultationHistory as getPatientConsultationHistoryService } from '../index.js';

/**
 * Retrieves the consultation history for the authenticated patient.
 *
 * GET /api/v1/consultations/patient
 * Query Params:
 *  - doctorProfileId (optional): filter by attending Doctor._id
 *  - limit (optional): maximum records to return
 */
export const getPatientHistory = async (req, res, next) => {
    try {
        const patientId = req.user._id || req.user.id;
        const { doctorProfileId, limit } = req.query;

        const history = await getPatientConsultationHistoryService({
            patientId,
            doctorProfileId,
            limit,
        });

        res.status(200).json({
            success: true,
            count: history.length,
            data: history,
        });
    } catch (error) {
        next(error);
    }
};
