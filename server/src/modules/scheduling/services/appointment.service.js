import { findDoctorById } from '../../identity/index.js';
import * as doctorLeaveRepository from '../repositories/doctorLeave.repository.js';
import * as doctorAvailabilityRepository from '../repositories/doctorAvailability.repository.js';
import * as appointmentRepository from '../repositories/appointment.repository.js';
import { generateSlots } from '../utils/slotGenerator.js';

export const bookAppointment = async ({
    patientId,
    doctorId,
    date,
    time,
}) => {
    // 1. Resolve doctor profile using canonical Doctor._id
    const doctorProfile = await findDoctorById(doctorId);

    if (!doctorProfile) {
        throw new Error('Doctor profile not found');
    }

    // 2. Check doctor leave using Doctor._id
    const leave = await doctorLeaveRepository.findByDoctorAndDate(
        doctorProfile._id,
        date
    );

    if (leave) {
        throw new Error('Doctor is on leave on this date');
    }

    // 3. Determine day of week
    const [year, month, day] = date.split('-').map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    // 4. Find availability using Doctor._id
    const availability = await doctorAvailabilityRepository.findActiveByDoctorAndDay(
        doctorProfile._id,
        dayOfWeek
    );

    if (!availability) {
        throw new Error('Doctor is not available on this day');
    }

    // 5. Generate valid slots
    const validSlots = generateSlots(
        availability.startTime,
        availability.endTime,
        availability.slotDuration
    );

    if (!validSlots.includes(time)) {
        throw new Error('Invalid time slot');
    }

    // 6. Check whether slot is already booked using Doctor._id
    const existingAppointment = await appointmentRepository.findActiveByDoctorAndDateTime(
        doctorProfile._id,
        date,
        time
    );

    if (existingAppointment) {
        throw new Error('Slot already booked');
    }

    // 7. Validate clinic association
    if (!doctorProfile.clinic) {
        throw new Error('Doctor is not associated with any clinic');
    }

    // 8. Create appointment
    const appointment = await appointmentRepository.create({
        patient: patientId,
        doctor: doctorProfile._id,
        clinic: doctorProfile.clinic,
        date,
        time,
        status: 'CONFIRMED',
    });

    return appointment;
};

/**
 * Returns available slots for a given doctor on a given date.
 *
 * @param {string} doctorId - Canonical Doctor._id
 * @param {string} date     - ISO date string "YYYY-MM-DD"
 * @returns {{ slots: Array<{ time: string, available: boolean }>, onLeave: boolean }}
 */
export const getAvailableSlots = async (doctorId, date) => {
    // 1. Resolve doctor profile using canonical Doctor._id
    const doctorProfile = await findDoctorById(doctorId);
    if (!doctorProfile) {
        throw new Error('Doctor not found');
    }

    // 2. Parse the date safely using local components to avoid UTC timezone shift
    const [year, month, day] = date.split('-').map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    // 3. Check if doctor is on leave
    const leave = await doctorLeaveRepository.findByDoctorAndDate(
        doctorProfile._id,
        date
    );

    if (leave) {
        return { slots: [], onLeave: true };
    }

    // 4. Fetch active availability for this day
    const availability = await doctorAvailabilityRepository.findActiveByDoctorAndDay(
        doctorProfile._id,
        dayOfWeek
    );

    if (!availability) {
        return { slots: [], onLeave: false };
    }

    // 5. Generate all possible slots
    const allSlots = generateSlots(
        availability.startTime,
        availability.endTime,
        availability.slotDuration
    );

    // 6. Fetch booked appointments for this doctor on this date
    const bookedAppointments = await appointmentRepository.findBookedByDoctorAndDate(
        doctorProfile._id,
        date
    );

    const bookedTimes = bookedAppointments.map((a) => a.time);

    // 7. Return slots annotated with availability
    const slots = allSlots.map((time) => ({
        time,
        available: !bookedTimes.includes(time),
    }));

    return { slots, onLeave: false };
};

/**
 * Returns appointment count statistics for a doctor's dashboard.
 *
 * @param {string} doctorId  - Canonical Doctor._id
 * @param {string} dateString - Today's date as "YYYY-MM-DD"
 * @returns {{ todayCount: number, pendingCount: number }}
 */
export const getDoctorAppointmentStats = async (doctorId, dateString) => {
    const [todayCount, pendingCount] = await Promise.all([
        appointmentRepository.countByDoctorAndDate(doctorId, dateString),
        appointmentRepository.countByDoctorAndStatuses(doctorId, ['BOOKED', 'CONFIRMED']),
    ]);

    return { todayCount, pendingCount };
};

/**
 * Returns completed appointments for a doctor, with patient info populated.
 * Each entry: { patient: { _id, name, phone }, date }
 *
 * @param {string} doctorId - Canonical Doctor._id
 * @returns {Array<{ patient: object, date: string }>}
 */
export const getCompletedAppointmentsByDoctor = async (doctorId) => {
    return appointmentRepository.findCompletedByDoctor(doctorId);
};

/**
 * Returns all appointment data needed for a patient's dashboard in one call.
 *
 * Runs the three appointment queries in parallel to minimise latency.
 *
 * @param {string} patientId   - User._id of the patient
 * @param {string} todayString - Today's date as "YYYY-MM-DD"
 * @returns {{
 *   totalCount: number,
 *   upcomingCount: number,
 *   upcomingList: Array<{ doctorName: string, clinicName: string, date: string, time: string }>
 * }}
 */
export const getPatientDashboardData = async (patientId, todayString) => {
    const [totalCount, upcomingCount, rawUpcoming] = await Promise.all([
        appointmentRepository.countByPatient(patientId),
        appointmentRepository.countUpcomingByPatient(patientId, todayString),
        appointmentRepository.findUpcomingByPatient(patientId, todayString, 5),
    ]);

    const upcomingList = rawUpcoming.map((apt) => ({
        doctorName: apt.doctor?.user?.name || 'Unknown Doctor',
        clinicName: apt.clinic?.name || 'Unknown Clinic',
        date: apt.date,
        time: apt.time,
    }));

    return { totalCount, upcomingCount, upcomingList };
};

/**
 * Retrieves all appointments for a given patient with doctor and clinic details.
 *
 * NOTE: Prescription URLs are Clinical data and are intentionally NOT fetched here.
 * Scheduling must not depend on Clinical. The controller fetches URLs via the Clinical
 * facade and composes the full response.
 *
 * @param {string} patientId - User._id of the patient
 * @returns {Promise<Array>}
 */
export const getPatientAppointments = async (patientId) => {
    const appointments = await appointmentRepository.findByPatientWithDetails(patientId);
    if (!appointments || appointments.length === 0) {
        return [];
    }
    return appointments;
};

/**
 * Retrieves all appointments for a given doctor profile with patient and clinic details.
 *
 * @param {string} doctorProfileId - Canonical Doctor._id
 * @returns {Promise<Array>}
 */
export const getDoctorAppointments = async (doctorProfileId) => {
    return appointmentRepository.findByDoctorWithDetails(doctorProfileId);
};

/**
 * Updates an appointment's status after verifying doctor ownership and validating the transition.
 *
 * @param {object} params
 * @param {string} params.appointmentId  - Appointment._id
 * @param {string} params.doctorProfileId - Canonical Doctor._id
 * @param {string} params.status          - One of 'CONFIRMED', 'COMPLETED', 'CANCELLED'
 * @returns {Promise<object>} Updated appointment document
 */
export const updateAppointmentStatus = async ({
    appointmentId,
    doctorProfileId,
    status,
}) => {
    if (!status || !['CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status)) {
        const error = new Error('Status must be CONFIRMED, COMPLETED, or CANCELLED');
        error.statusCode = 400;
        throw error;
    }

    const appointment = await appointmentRepository.findById(appointmentId);
    if (!appointment) {
        const error = new Error('Appointment not found');
        error.statusCode = 404;
        throw error;
    }

    if (appointment.doctor.toString() !== doctorProfileId.toString()) {
        const error = new Error('Not authorized to update this appointment');
        error.statusCode = 403;
        throw error;
    }

    appointment.status = status;
    return appointmentRepository.save(appointment);
};

/**
 * Verifies that an appointment exists, belongs to the doctor, and is in an active state
 * eligible for consultation (BOOKED or CONFIRMED). Does NOT mutate status.
 *
 * @param {object} params
 * @param {string} params.appointmentId  - Appointment._id
 * @param {string} params.doctorProfileId - Canonical Doctor._id
 * @returns {Promise<object>} Appointment document
 */
export const getAppointmentForConsultation = async ({ appointmentId, doctorProfileId }) => {
    const appointment = await appointmentRepository.findById(appointmentId);
    if (!appointment) {
        const error = new Error('Appointment not found');
        error.statusCode = 404;
        throw error;
    }

    if (appointment.doctor.toString() !== doctorProfileId.toString()) {
        const error = new Error('Not authorized to update this appointment');
        error.statusCode = 403;
        throw error;
    }

    if (!['BOOKED', 'CONFIRMED'].includes(appointment.status)) {
        const error = new Error('Can only complete a BOOKED or CONFIRMED appointment');
        error.statusCode = 400;
        throw error;
    }

    return appointment;
};


/**
 * Completes an appointment slot after verifying doctor ownership and valid status.
 * Scheduling owns the lifecycle state transition to COMPLETED.
 *
 * @param {string|object} appointmentIdOrParams - Appointment._id or options object
 * @param {string} [doctorProfileIdParam]      - Canonical Doctor._id
 * @returns {Promise<object>} Updated appointment document populated for response
 */
export const completeAppointment = async (appointmentIdOrParams, doctorProfileIdParam) => {
    let appointmentId;
    let doctorProfileId;

    if (typeof appointmentIdOrParams === 'object' && appointmentIdOrParams !== null && appointmentIdOrParams.appointmentId) {
        appointmentId = appointmentIdOrParams.appointmentId;
        doctorProfileId = appointmentIdOrParams.doctorProfileId;
    } else {
        appointmentId = appointmentIdOrParams;
        doctorProfileId = doctorProfileIdParam;
    }

    const appointment = await appointmentRepository.findById(appointmentId);
    if (!appointment) {
        const error = new Error('Appointment not found');
        error.statusCode = 404;
        throw error;
    }

    if (appointment.doctor.toString() !== doctorProfileId.toString()) {
        const error = new Error('Not authorized to update this appointment');
        error.statusCode = 403;
        throw error;
    }

    if (!['BOOKED', 'CONFIRMED'].includes(appointment.status)) {
        const error = new Error('Can only complete a BOOKED or CONFIRMED appointment');
        error.statusCode = 400;
        throw error;
    }

    appointment.status = 'COMPLETED';
    await appointmentRepository.save(appointment);

    return appointmentRepository.findPopulatedConsultationById(appointmentId);
};

/**
 * Returns a fully populated appointment document for the doctor consultation view.
 * Verifies the appointment belongs to the doctor.
 *
 * NOTE: Clinical data (consultation record + history) is intentionally NOT fetched here.
 * Scheduling must not depend on Clinical. The controller fetches clinical data via the Clinical
 * facade and composes the full response.
 *
 * @param {object} params
 * @param {string} params.appointmentId  - Appointment._id
 * @param {string} params.doctorProfileId - Canonical Doctor._id
 * @returns {Promise<object>} Populated appointment document
 */
export const getAppointmentDetails = async ({ appointmentId, doctorProfileId }) => {
    const appointment = await appointmentRepository.findDetailsById(appointmentId);

    if (!appointment) {
        const error = new Error('Appointment not found');
        error.statusCode = 404;
        throw error;
    }

    if (appointment.doctor._id.toString() !== doctorProfileId.toString()) {
        const error = new Error('Not authorized to view this appointment');
        error.statusCode = 403;
        throw error;
    }

    return appointment;
};

/**
 * Returns appointment counts needed for admin platform analytics.
 *
 * @returns {Promise<object>} { totalAppointments, completedAppointments, pendingAppointments }
 */
export const getAppointmentStatsForAdmin = async () => {
    const [totalAppointments, completedAppointments, pendingAppointments] = await Promise.all([
        appointmentRepository.countAll(),
        appointmentRepository.countByStatuses(['COMPLETED']),
        appointmentRepository.countByStatuses(['BOOKED', 'PENDING']),
    ]);

    return {
        totalAppointments,
        completedAppointments,
        pendingAppointments,
    };
};