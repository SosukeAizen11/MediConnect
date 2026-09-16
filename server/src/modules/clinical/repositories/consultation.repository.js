import mongoose from 'mongoose';
import Consultation from '../models/consultation.model.js';

export const create = async (consultationData) => {
    return Consultation.create(consultationData);
};

export const findById = async (consultationId) => {
    return Consultation.findById(consultationId);
};

export const findByAppointment = async (appointmentId) => {
    return Consultation.findOne({
        appointment: appointmentId,
    });
};

export const findByToken = async (tokenId) => {
    return Consultation.findOne({
        token: tokenId,
    });
};

export const findByPatient = async (patientId) => {
    return Consultation.find({
        patient: patientId,
    })
        .populate({
            path: 'doctor',
            populate: {
                path: 'user',
                select: 'name email',
            },
        })
        .populate('clinic', 'name address')
        .sort({ completedAt: -1 });
};

/**
 * Retrieves consultation history for a patient across all intake mechanisms (Appointment and Token).
 * Optionally filters by attending doctor and applies a maximum limit.
 *
 * @param {object} params
 * @param {string} params.patientId       - User._id of the patient
 * @param {string} [params.doctorProfileId] - Optional Doctor._id filter
 * @param {number} [params.limit]         - Maximum number of consultations to return
 * @returns {Promise<Array>}
 */
export const findPatientHistory = async ({ patientId, doctorProfileId, limit }) => {
    const query = { patient: patientId };
    if (doctorProfileId) {
        query.doctor = doctorProfileId;
    }

    let cursor = Consultation.find(query)
        .populate({
            path: 'doctor',
            populate: {
                path: 'user',
                select: 'name email',
            },
        })
        .populate('clinic', 'name address')
        .populate('appointment', 'date time')
        .populate('token', 'tokenNumber date')
        .sort({ completedAt: -1 });

    if (limit && Number.isInteger(limit) && limit > 0) {
        cursor = cursor.limit(limit);
    }

    return cursor;
};

/**
 * Retrieves distinct patients consulted by a doctor across both Appointment and Token encounters.
 * Uses database-level grouping for performance and sorts by most recent visit date.
 *
 * @param {string|mongoose.Types.ObjectId} doctorProfileId - Doctor._id
 * @returns {Promise<Array<{ patientId: string, fullName: string, phone: string, lastVisitDate: string }>>}
 */
export const findPatientsByDoctor = async (doctorProfileId) => {
    const docObjId = typeof doctorProfileId === 'string'
        ? new mongoose.Types.ObjectId(doctorProfileId)
        : doctorProfileId;

    return Consultation.aggregate([
        { $match: { doctor: docObjId } },
        { $sort: { completedAt: -1 } },
        {
            $group: {
                _id: '$patient',
                lastVisitDate: { $first: '$consultationDate' },
                lastCompletedAt: { $first: '$completedAt' },
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'patientDoc',
            },
        },
        {
            $unwind: {
                path: '$patientDoc',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                _id: 0,
                patientId: { $toString: '$_id' },
                fullName: { $ifNull: ['$patientDoc.name', 'Unknown Patient'] },
                phone: { $ifNull: ['$patientDoc.phone', ''] },
                lastVisitDate: {
                    $ifNull: [
                        '$lastVisitDate',
                        { $dateToString: { format: '%Y-%m-%d', date: '$lastCompletedAt' } },
                    ],
                },
            },
        },
        { $sort: { lastVisitDate: -1 } },
    ]);
};

/**
 * Batch lookup of prescription URLs for a list of appointment IDs.
 *
 * @param {Array<string>} appointmentIds
 * @returns {Promise<Array<{ appointment: mongoose.Types.ObjectId, prescriptionUrl: string }>>}
 */
export const findPrescriptionUrlsByAppointments = async (appointmentIds) => {
    if (!appointmentIds || appointmentIds.length === 0) return [];
    return Consultation.find({
        appointment: { $in: appointmentIds },
        prescriptionUrl: { $exists: true, $ne: '' },
    }).select('appointment prescriptionUrl');
};