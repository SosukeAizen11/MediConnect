import Clinic from '../../../models/clinic.model.js';

import {
    joinQueue as joinQueueService,
    getPatientTokens as getPatientTokensService,
    getMyToken as getMyTokenService,
    getDoctorQueue as getDoctorQueueService,
    advanceToken as advanceTokenService,
    getTokenDetails as getTokenDetailsService,
} from '../services/token.service.js';

import {
    completeTokenConsultation as completeTokenConsultationService,
    getConsultationByTokenId,
    getPatientConsultationHistory,
} from '../../clinical/index.js';

import { getOrCreateDoctorProfile } from '../../../services/doctor.service.js';


// ─── Patient: Join token queue ────────────────────────────────────────────────

export const joinTokenQueue = async (req, res) => {
    try {
        const patientId = req.user.id;
        const { clinicId } = req.body;

        if (!clinicId) {
            return res.status(400).json({ message: 'Clinic ID is required' });
        }

        // Clinic validation: existence and type are request-level concerns
        const clinic = await Clinic.findById(clinicId);
        if (!clinic) {
            return res.status(404).json({ message: 'Clinic not found' });
        }

        if (clinic.clinicType !== 'TOKEN') {
            return res.status(400).json({ message: 'This clinic does not use token system' });
        }

        const { tokenNumber, tokensAhead } = await joinQueueService({ patientId, clinicId });

        return res.status(201).json({
            message: 'Token assigned successfully',
            tokenNumber,
            tokensAhead,
            estimatedWait: `${tokensAhead * 10} minutes`,
        });
    } catch (error) {
        if (error.statusCode === 400 && error.tokenNumber) {
            return res.status(400).json({
                message: error.message,
                tokenNumber: error.tokenNumber,
            });
        }
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error('Join token queue error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};


// ─── Patient: Get all active/future tokens ────────────────────────────────────

export const getPatientTokens = async (req, res) => {
    try {
        const tokens = await getPatientTokensService(req.user.id);
        return res.json({ data: tokens });
    } catch (error) {
        console.error('Get patient tokens error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};


// ─── Patient: Get current active token with queue status ──────────────────────

export const getMyToken = async (req, res) => {
    try {
        const result = await getMyTokenService(req.user.id);
        return res.json(result);
    } catch (error) {
        console.error('Get my token error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};


// ─── Doctor: Get token queue for their clinic ─────────────────────────────────

export const getDoctorTokenQueue = async (req, res) => {
    try {
        const doctorDoc = await getOrCreateDoctorProfile(req.user._id);

        if (!doctorDoc.clinic) {
            return res.status(400).json({
                message: 'No clinic linked to your profile. Please complete profile setup.',
            });
        }

        // Clinic validation: type check is a request-level guard
        const clinic = await Clinic.findById(doctorDoc.clinic);
        if (!clinic) {
            return res.status(404).json({ message: 'Clinic not found' });
        }

        if (clinic.clinicType !== 'TOKEN') {
            return res.status(400).json({
                message: 'This clinic does not use token system',
            });
        }

        const queueData = await getDoctorQueueService(doctorDoc.clinic, clinic.name);

        return res.status(200).json({ success: true, data: queueData });
    } catch (error) {
        console.error('Get doctor token queue error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};


// ─── Doctor: Advance to next token ───────────────────────────────────────────

export const advanceToken = async (req, res) => {
    try {
        const doctorDoc = await getOrCreateDoctorProfile(req.user._id);

        if (!doctorDoc.clinic) {
            return res.status(400).json({
                message: 'No clinic linked to your profile.',
            });
        }

        const clinic = await Clinic.findById(doctorDoc.clinic);

        const { message, data } = await advanceTokenService(
            doctorDoc.clinic,
            clinic?.name || ''
        );

        return res.status(200).json({ success: true, message, data });
    } catch (error) {
        console.error('Advance token error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};


// ─── Doctor: Get token details for consultation ───────────────────────────────

export const getTokenDetails = async (req, res) => {
    try {
        const { tokenId } = req.params;
        const doctorDoc = await getOrCreateDoctorProfile(req.user._id);

        // Queue service fetches the token and verifies clinic ownership
        const token = await getTokenDetailsService({
            tokenId,
            doctorClinicId: doctorDoc.clinic,
        });

        // Clinical data — fetched here because Queue must not depend on Clinical
        const [consultation, consultationHistory] = await Promise.all([
            getConsultationByTokenId(tokenId),
            getPatientConsultationHistory({
                patientId: token.patient._id,
                doctorProfileId: doctorDoc._id,
                limit: 10,
            }),
        ]);

        // Compose token object with canonical clinical fields
        const tokenObj = token.toObject ? token.toObject() : { ...token };

        if (consultation) {
            tokenObj.diagnosis = consultation.diagnosis || tokenObj.diagnosis || '';
            tokenObj.prescription =
                consultation.prescription || tokenObj.prescription || '';
            tokenObj.consultationNotes =
                consultation.consultationNotes || tokenObj.consultationNotes || '';
        }

        // Compose past tokens from clinical consultation history
        const pastTokens = (consultationHistory || [])
            .filter((c) => {
                const isCurrentToken =
                    c.token &&
                    (
                        (c.token._id &&
                            c.token._id.toString() === tokenId.toString()) ||
                        c.token.toString() === tokenId.toString()
                    );
                const isCurrentConsultation =
                    consultation &&
                    c._id.toString() === consultation._id.toString();
                return !isCurrentToken && !isCurrentConsultation;
            })
            .map((c) => ({
                _id: c._id,
                date:
                    c.consultationDate ||
                    (c.completedAt
                        ? new Date(c.completedAt).toISOString().split('T')[0]
                        : ''),
                tokenNumber:
                    c.token && c.token.tokenNumber != null
                        ? c.token.tokenNumber
                        : c.originType === 'APPOINTMENT'
                            ? 'Appt'
                            : '',
                status: 'COMPLETED',
                diagnosis: c.diagnosis || '',
                prescription: c.prescription || '',
                consultationNotes: c.consultationNotes || '',
                clinic: c.clinic || null,
                doctor: c.doctor || null,
                originType: c.originType,
            }));

        return res.status(200).json({
            success: true,
            data: { token: tokenObj, pastTokens },
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error('Get token details error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};


// ─── Doctor: Complete token consultation ──────────────────────────────────────

export const completeTokenConsultation = async (req, res) => {
    try {
        const { tokenId } = req.params;
        const { diagnosis, prescription, consultationNotes } = req.body;

        const doctorDoc = await getOrCreateDoctorProfile(req.user._id);

        const token = await completeTokenConsultationService({
            tokenId,
            doctorClinicId: doctorDoc.clinic,
            doctorProfileId: doctorDoc._id,
            diagnosis,
            prescription,
            consultationNotes,
        });

        return res.status(200).json({
            success: true,
            message: 'Consultation completed successfully',
            data: token,
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error('Complete token consultation error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
