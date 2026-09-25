/**
 * Identity Module Public Facade
 *
 * Thin public interface exposing User/Doctor identity operations to other modules.
 *
 * IMPORTANT: Do not import identity internals (models, repository) from outside this
 * module for Doctor operations. Doctor access must go through this facade.
 * User model remains importable until a dedicated User facade exists.
 */

import './models/user.model.js';

export {
    getOrCreateDoctorProfile,
    findDoctorById,
    findDoctorByUserId,
    linkClinicToDoctor,
    getDoctorProfileWithClinicStatus,
} from './services/doctor.service.js';

export {
    findUserByEmail,
    findUserById,
    createUser,
} from './services/user.service.js';