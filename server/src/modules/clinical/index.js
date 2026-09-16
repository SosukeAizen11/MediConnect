/**
 * Clinical Module Public Facade
 *
 * Thin public interface exposing clinical / consultation domain operations.
 */

export {
    createConsultation,
    completeConsultation,
    completeTokenConsultation,
    getConsultationByAppointmentId,
    getConsultationByTokenId,
    getConsultationById,
    getPatientConsultationHistory,
    getDoctorConsultedPatients,
    getPrescriptionUrlsForAppointments,
} from './services/consultation.service.js';


