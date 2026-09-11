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
} from '../../services/appointment.service.js';

