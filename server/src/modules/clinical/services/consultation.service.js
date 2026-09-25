import streamifier from 'streamifier';
import cloudinary from '../../../config/cloudinary.js';
import { findUserById } from '../../identity/index.js';
import { generatePrescriptionPDF } from '../../../utils/generatePrescription.js';
import {
    getAppointmentForConsultation,
    completeAppointment,
} from '../../scheduling/index.js';
import {
    getTokenForConsultation,
    completeToken,
} from '../../queue/index.js';
import * as consultationRepository from '../repositories/consultation.repository.js';

/**
 * Creates a canonical clinical Consultation record.
 * Contains business and domain validation only, not HTTP logic.
 *
 * @param {object} params
 * @param {string} [params.patientId] - User._id (patient)
 * @param {string} [params.patient]   - Alternative alias for patientId
 * @param {string} [params.doctorId]  - Doctor._id (canonical doctor profile)
 * @param {string} [params.doctor]    - Alternative alias for doctorId
 * @param {string} [params.clinicId]  - Clinic._id
 * @param {string} [params.clinic]    - Alternative alias for clinicId
 * @param {'APPOINTMENT'|'TOKEN'} params.originType - Intake channel
 * @param {string} [params.appointmentId] - Appointment._id (required if originType is APPOINTMENT)
 * @param {string} [params.appointment]   - Alternative alias for appointmentId
 * @param {string} [params.tokenId]       - Token._id (required if originType is TOKEN)
 * @param {string} [params.token]         - Alternative alias for tokenId
 * @param {string} params.diagnosis       - Clinical diagnosis (required)
 * @param {string} [params.prescription]  - Prescription medications
 * @param {string} [params.consultationNotes] - Clinical consultation notes
 * @param {string} [params.prescriptionUrl]   - Uploaded PDF document URL
 * @param {string} params.consultationDate    - Date of consultation
 * @param {Date}   [params.completedAt]       - Completion timestamp
 * @returns {Promise<object>} Created Consultation record
 */
export const createConsultation = async ({
    patientId,
    patient,
    doctorId,
    doctor,
    clinicId,
    clinic,
    originType,
    appointmentId,
    appointment,
    tokenId,
    token,
    diagnosis,
    prescription,
    consultationNotes,
    prescriptionUrl,
    consultationDate,
    completedAt,
}) => {
    // 1. Validate diagnosis
    if (!diagnosis || !diagnosis.trim()) {
        const error = new Error('Diagnosis is required');
        error.statusCode = 400;
        throw error;
    }

    // 2. Validate originType
    if (!originType || !['APPOINTMENT', 'TOKEN'].includes(originType)) {
        const error = new Error("Invalid originType: must be 'APPOINTMENT' or 'TOKEN'");
        error.statusCode = 400;
        throw error;
    }

    const resolvedAppointmentId = appointmentId || appointment;
    const resolvedTokenId = tokenId || token;

    // 3. Require appointmentId when originType is APPOINTMENT
    if (originType === 'APPOINTMENT' && !resolvedAppointmentId) {
        const error = new Error('appointmentId is required when originType is APPOINTMENT');
        error.statusCode = 400;
        throw error;
    }

    // 4. Require tokenId when originType is TOKEN
    if (originType === 'TOKEN' && !resolvedTokenId) {
        const error = new Error('tokenId is required when originType is TOKEN');
        error.statusCode = 400;
        throw error;
    }

    const resolvedPatientId = patientId || patient;
    const resolvedDoctorId = doctorId || doctor;
    const resolvedClinicId = clinicId || clinic;

    // 5. Call consultationRepository.create()
    return consultationRepository.create({
        patient: resolvedPatientId,
        doctor: resolvedDoctorId,
        clinic: resolvedClinicId,
        originType,
        ...(originType === 'APPOINTMENT' && resolvedAppointmentId ? { appointment: resolvedAppointmentId } : {}),
        ...(originType === 'TOKEN' && resolvedTokenId ? { token: resolvedTokenId } : {}),
        diagnosis: diagnosis.trim(),
        prescription: prescription || '',
        consultationNotes: consultationNotes || '',
        prescriptionUrl: prescriptionUrl || '',
        consultationDate,
        ...(completedAt ? { completedAt } : {}),
    });
};

/**
 * Uploads a generated prescription PDF buffer to Cloudinary storage.
 *
 * @param {Buffer} buffer - Generated PDF buffer
 * @returns {Promise<object>} Cloudinary upload result
 */
const uploadPrescriptionToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'mediconnect/prescriptions',
                resource_type: 'auto',
                type: 'upload',
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });
};

/**
 * Completes a medical consultation encounter with safe ordering:
 * 1. Validates diagnosis requirement (Clinical validation).
 * 2. Verifies appointment exists, belongs to doctor, and is active without mutating status (Scheduling).
 * 3. Generates prescription PDF and uploads to Cloudinary (Clinical document pipeline).
 * 4. Creates canonical Consultation record using createConsultation() / consultation repository.
 * 5. Transitions appointment lifecycle status to COMPLETED via the Scheduling facade.
 *
 * NOTE: The appointment is only marked COMPLETED after the clinical Consultation record has been
 * successfully created. Cloudinary upload failure is non-fatal: if it fails, consultation completion
 * proceeds without a PDF URL, matching the established product behavior.
 *
 * @param {object} params
 * @param {string} params.appointmentId  - Appointment._id
 * @param {string} params.doctorProfileId - Canonical Doctor._id
 * @param {string} [params.doctorName]    - Doctor display name from auth token
 * @param {string} params.diagnosis       - Clinical diagnosis
 * @param {string} [params.prescription]  - Prescription medications
 * @param {string} [params.consultationNotes] - Clinical consultation notes
 * @returns {Promise<object>} Populated appointment document
 */
export const completeConsultation = async ({
    appointmentId,
    doctorProfileId,
    doctorName,
    diagnosis,
    prescription,
    consultationNotes,
}) => {
    if (!diagnosis) {
        const error = new Error('Diagnosis is required');
        error.statusCode = 400;
        throw error;
    }

    // 1. Verify appointment exists, belongs to doctor, and is eligible (Scheduling)
    // Does NOT mutate status yet (status remains BOOKED or CONFIRMED).
    const appointment = await getAppointmentForConsultation({
        appointmentId,
        doctorProfileId,
    });

    // 2. Generate PDF and upload to Cloudinary (Clinical document concerns)
    let prescriptionUrl = '';
    try {
        const patientObj = await findUserById(appointment.patient);
        const patientName = patientObj?.name || 'Patient';
        const docName = doctorName || 'Doctor';

        const pdfBuffer = await generatePrescriptionPDF({
            patientName,
            doctorName: `Dr. ${docName}`,
            diagnosis,
            prescription: prescription || '',
            notes: consultationNotes || '',
            date: appointment.date,
        });

        const cloudinaryResult = await uploadPrescriptionToCloudinary(pdfBuffer);
        prescriptionUrl = cloudinaryResult.secure_url;
    } catch (pdfError) {
        console.error('Failed to generate or upload Prescription PDF:', pdfError);
        // Non-blocking error: preserve consultation completion even if PDF/Cloudinary fails
    }

    // 3. Create canonical Consultation record in clinical persistence
    await createConsultation({
        patientId: appointment.patient,
        doctorId: doctorProfileId,
        clinicId: appointment.clinic,
        originType: 'APPOINTMENT',
        appointmentId,
        tokenId: null,
        diagnosis,
        prescription: prescription || '',
        consultationNotes: consultationNotes || '',
        prescriptionUrl,
        consultationDate: appointment.date,
    });

    // 4. Trigger lifecycle transition to COMPLETED via Scheduling facade
    // Returns the populated appointment document matching the API contract
    return completeAppointment(appointmentId, doctorProfileId);
};

/**
 * Completes a token (walk-in) consultation encounter:
 * 1. Validates diagnosis requirement (Clinical validation).
 * 2. Verifies token exists, belongs to doctor's clinic, and is CALLED without mutating status (Queue verification).
 * 3. Creates canonical Consultation record using createConsultation() in clinical persistence.
 * 4. Triggers queue lifecycle transition to COMPLETED & Socket.IO broadcast via Queue facade.
 * 5. Returns completed token record matching existing API contract.
 *
 * NOTE: Token consultations intentionally do NOT generate a prescription PDF or upload to Cloudinary,
 * preserving current product behavior.
 *
 * @param {object} params
 * @param {string} params.tokenId         - Token._id
 * @param {string} params.doctorClinicId  - Doctor profile's clinic ObjectId
 * @param {string} params.doctorProfileId - Canonical Doctor._id
 * @param {string} params.diagnosis       - Clinical diagnosis
 * @param {string} [params.prescription]  - Prescription medications
 * @param {string} [params.consultationNotes] - Clinical consultation notes
 * @returns {Promise<object>} Completed token document
 */
export const completeTokenConsultation = async ({
    tokenId,
    doctorClinicId,
    doctorProfileId,
    diagnosis,
    prescription,
    consultationNotes,
}) => {
    if (!diagnosis || !diagnosis.trim()) {
        const error = new Error('Diagnosis is required');
        error.statusCode = 400;
        throw error;
    }

    if (!doctorProfileId) {
        const error = new Error('Doctor profile ID is required');
        error.statusCode = 400;
        throw error;
    }

    // 1. Verify token status, existence, and clinic authorization (Queue)
    // Does NOT mutate status (remains CALLED).
    const token = await getTokenForConsultation({
        tokenId,
        doctorClinicId,
    });

    // 2. Create canonical Consultation record in clinical persistence
    const consultationDate = token.date
        ? new Date(token.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

    await createConsultation({
        patientId: token.patient,
        doctorId: doctorProfileId,
        clinicId: token.clinic,
        originType: 'TOKEN',
        appointmentId: null,
        tokenId,
        diagnosis: diagnosis.trim(),
        prescription: prescription || '',
        consultationNotes: consultationNotes || '',
        prescriptionUrl: '',
        consultationDate,
    });

    // 3. Complete queue item & emit live waiting-room updates via Queue facade
    return completeToken({
        tokenId,
        doctorClinicId,
    });
};

/**
 * Retrieves the canonical Consultation record associated with an Appointment.
 *
 * @param {string} appointmentId
 * @returns {Promise<object|null>}
 */
export const getConsultationByAppointmentId = async (appointmentId) => {
    if (!appointmentId) return null;
    return consultationRepository.findByAppointment(appointmentId);
};

/**
 * Retrieves the canonical Consultation record associated with a Token.
 *
 * @param {string} tokenId
 * @returns {Promise<object|null>}
 */
export const getConsultationByTokenId = async (tokenId) => {
    if (!tokenId) return null;
    return consultationRepository.findByToken(tokenId);
};

/**
 * Retrieves the unified consultation history for a patient across all intake mechanisms
 * (both APPOINTMENT and TOKEN origin consultations).
 *
 * @param {object} params
 * @param {string} params.patientId         - User._id of patient
 * @param {string} [params.doctorProfileId] - Optional Doctor._id to scope history
 * @param {number|string} [params.limit]    - Optional maximum records to return
 * @returns {Promise<Array>}
 */
export const getPatientConsultationHistory = async ({
    patientId,
    doctorProfileId,
    limit,
}) => {
    if (!patientId) {
        const error = new Error('patientId is required');
        error.statusCode = 400;
        throw error;
    }

    const parsedLimit = limit ? parseInt(limit, 10) : undefined;

    return consultationRepository.findPatientHistory({
        patientId,
        doctorProfileId,
        limit: parsedLimit && parsedLimit > 0 ? parsedLimit : undefined,
    });
};

/**
 * Returns the doctor's consulted-patient roster using only canonical Consultation records.
 * Provides distinct patients sorted by most recent visit date.
 *
 * @param {string} doctorProfileId - Canonical Doctor._id
 * @returns {Promise<Array<{ patientId: string, fullName: string, phone: string, lastVisitDate: string }>>}
 */
export const getDoctorConsultedPatients = async (doctorProfileId) => {
    if (!doctorProfileId) {
        const error = new Error('doctorProfileId is required');
        error.statusCode = 400;
        throw error;
    }

    return consultationRepository.findPatientsByDoctor(doctorProfileId);
};

/**
 * Batch lookup of prescription URLs for a list of appointment IDs.
 * Returns a key-value dictionary mapping { [appointmentId]: prescriptionUrl }.
 * Avoids N+1 queries when decorating appointment lists.
 *
 * @param {Array<string>} appointmentIds
 * @returns {Promise<Object<string, string>>}
 */
export const getPrescriptionUrlsForAppointments = async (appointmentIds) => {
    if (!appointmentIds || !Array.isArray(appointmentIds) || appointmentIds.length === 0) {
        return {};
    }

    const records = await consultationRepository.findPrescriptionUrlsByAppointments(appointmentIds);
    const urlMap = {};
    for (const record of records) {
        if (record.appointment && record.prescriptionUrl) {
            urlMap[record.appointment.toString()] = record.prescriptionUrl;
        }
    }
    return urlMap;
};
/**
 * Retrieves a single Consultation document by its own _id.
 *
 * @param {string} consultationId - Consultation._id
 * @returns {Promise<object|null>}
 */
export const getConsultationById = async (consultationId) => {
    if (!consultationId) {
        const error = new Error('consultationId is required');
        error.statusCode = 400;
        throw error;
    }
    return consultationRepository.findById(consultationId);
};
