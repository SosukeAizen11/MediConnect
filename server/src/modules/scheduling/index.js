/**
 * Scheduling Module Public Facade
 * 
 * Thin public interface exposing scheduling domain operations to other modules.
 */

export {
    bookAppointment,
    getAvailableSlots,
    getDoctorAppointmentStats,
    getCompletedAppointmentsByDoctor,
    getPatientDashboardData,
    getPatientAppointments,
    getDoctorAppointments,
    updateAppointmentStatus,
    completeAppointment,
    getAppointmentForConsultation,
    getAppointmentDetails,
    getAppointmentStatsForAdmin,
} from './services/appointment.service.js';

export {
    createAvailability,
    getMyAvailability,
    updateAvailability,
    deleteAvailability,
} from './services/doctorAvailability.service.js';

export {
    getMyLeaves,
    createLeave,
    deleteLeave,
} from './services/doctorLeave.service.js';



