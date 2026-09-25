/**
 * Identity Module Public Facade
 *
 * Thin public interface exposing User/Doctor identity operations to other modules.
 *
 * IMPORTANT: Do not import identity internals (models, repository) from outside this
 * module for Doctor operations. Doctor access must go through this facade.
 */

import './models/user.model.js';

export {
    getOrCreateDoctorProfile,
    createDoctorProfile,
    updateDoctorProfile,
    findDoctorById,
    findDoctorByUserId,
    findDoctorsByClinic,
    linkClinicToDoctor,
    getDoctorProfileWithClinicStatus,
} from './services/doctor.service.js';

export {
    findUserByEmail,
    findUserById,
    findUsersForAdmin,
    countUsers,
    createUser,
    updateUserProfile,
    updateUserActiveStatus,
    deleteUserById,
} from './services/user.service.js';