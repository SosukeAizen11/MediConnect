/**
 * Queue Module Public Facade
 *
 * Thin public interface exposing token queue domain operations to other modules.
 *
 * IMPORTANT: Do not import queue internals (repository, model) from outside this module.
 * All external access must go through this facade.
 */

export {
    // Patient operations
    joinQueue,
    getPatientTokens,
    getMyToken,

    // Doctor operations
    getDoctorQueue,
    advanceToken,
    getTokenDetails,

    // Clinical integration (called by Clinical module to complete a token encounter)
    getTokenForConsultation,
    completeToken,
} from './services/token.service.js';
