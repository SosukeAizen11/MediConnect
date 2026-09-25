/**
 * Patient Module Public Facade
 *
 * Thin public interface exposing patient-facing orchestration capabilities.
 */

export {
    getProfile,
    updateProfile,
    getDashboardStats,
} from './controllers/patient.controller.js';
