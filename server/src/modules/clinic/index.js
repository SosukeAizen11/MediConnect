/**
 * Clinic Module Public Facade
 *
 * Thin public interface exposing clinic domain operations to other modules.
 *
 * IMPORTANT: Do not import clinic internals (model, service) from outside this
 * module for Clinic domain operations. Use this facade instead.
 */

import './models/clinic.model.js';

export {
    getClinicById,
    approveClinic,
    createClinic,
    findApprovedActiveClinics,
} from './services/clinic.service.js';
