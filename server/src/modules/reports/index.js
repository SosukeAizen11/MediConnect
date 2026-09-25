/**
 * Reports Module Public Facade
 *
 * Public API for the current reports domain.
 */

export {
    getPatientReportCount,
    getReportForPatient,
} from './services/report.service.js';

export {
    uploadReport,
    getMyReports,
    getPatientReports,
    deleteReport,
} from './controllers/report.controller.js';
