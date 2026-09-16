import apiClient from './apiClient';

/**
 * Retrieves the authenticated patient's clinical consultation history
 * across both Appointment and Token intake channels.
 *
 * Endpoint: GET /api/v1/consultations/patient
 *
 * @returns {Promise<object>} { success: true, count: number, data: Array<Consultation> }
 */
export const getPatientConsultationHistory = async () => {
    const response = await apiClient.get('/consultations/patient');
    return response.data;
};
