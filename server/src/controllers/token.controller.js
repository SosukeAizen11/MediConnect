import Token from '../models/token.model.js';
import Clinic from '../models/clinic.model.js';
import Doctor from '../models/doctor.model.js';
import { getIO } from '../socket.js';

// Join token queue
export const joinTokenQueue = async (req, res) => {
    try {
        const patientId = req.user.id;
        const { clinicId } = req.body;

        if (!clinicId) {
            return res.status(400).json({ message: 'Clinic ID is required' });
        }

        // Verify clinic exists and is token-based
        const clinic = await Clinic.findById(clinicId);
        if (!clinic) {
            return res.status(404).json({ message: 'Clinic not found' });
        }

        if (clinic.clinicType !== 'TOKEN') {
            return res.status(400).json({ message: 'This clinic does not use token system' });
        }

        // Get today's date (midnight)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if patient already has a token for this clinic today
        const existingToken = await Token.findOne({
            patient: patientId,
            clinic: clinicId,
            date: today,
            status: { $in: ['WAITING', 'CALLED'] },
        });

        if (existingToken) {
            return res.status(400).json({
                message: 'You already have an active token for this clinic today',
                tokenNumber: existingToken.tokenNumber,
            });
        }

        // Get the next token number for this clinic today
        const lastToken = await Token.findOne({
            clinic: clinicId,
            date: today,
        }).sort({ tokenNumber: -1 });

        const nextTokenNumber = lastToken ? lastToken.tokenNumber + 1 : 1;

        // Create new token
        const token = new Token({
            patient: patientId,
            clinic: clinicId,
            tokenNumber: nextTokenNumber,
            date: today,
        });

        await token.save();

        const tokensAhead = await Token.countDocuments({
            clinic: clinicId,
            date: today,
            tokenNumber: { $lt: nextTokenNumber },
            status: 'WAITING',
        });

        // Emit real-time update to the specific clinic room
        try {
            const io = getIO();
            const waitingTokens = await Token.find({
                clinic: clinicId,
                date: today,
                status: 'WAITING',
            }).populate('patient', 'name email phone').sort({ tokenNumber: 1 });

            const currentServing = await Token.findOne({
                clinic: clinicId,
                date: today,
                status: 'CALLED'
            }).populate('patient', 'name email phone');

            io.to(`clinic:${clinicId.toString()}`).emit('token:update', {
                currentToken: currentServing || null,
                waitingTokens
            });
        } catch (socketError) {
            console.error('Socket emission error:', socketError);
        }

        res.status(201).json({
            message: 'Token assigned successfully',
            tokenNumber: nextTokenNumber,
            tokensAhead,
            estimatedWait: `${tokensAhead * 10} minutes`,
        });
    } catch (error) {
        console.error('Join token queue error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get patient's active tokens
export const getPatientTokens = async (req, res) => {
    try {
        const patientId = req.user.id;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tokens = await Token.find({
            patient: patientId,
            date: { $gte: today },
        })
            .populate('clinic', 'name address')
            .sort({ createdAt: -1 });

        res.json({ data: tokens });
    } catch (error) {
        console.error('Get patient tokens error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get patient's current active token with queue status
export const getMyToken = async (req, res) => {
    try {
        const patientId = req.user.id;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find patient's active token for today
        const token = await Token.findOne({
            patient: patientId,
            date: today,
            status: { $in: ['WAITING', 'CALLED'] },
        }).populate('clinic', 'name address');

        if (!token) {
            return res.json({
                hasActiveToken: false,
                data: null,
            });
        }

        // Get current token being served
        const currentServingToken = await Token.findOne({
            clinic: token.clinic._id,
            date: today,
            status: 'CALLED',
        }).sort({ tokenNumber: 1 });

        let currentToken = 0;
        if (currentServingToken) {
            currentToken = currentServingToken.tokenNumber;
        } else {
            const lastCompleted = await Token.findOne({
                clinic: token.clinic._id,
                date: today,
                status: 'COMPLETED',
            }).sort({ tokenNumber: -1 });
            currentToken = lastCompleted ? lastCompleted.tokenNumber : 0;
        }

        // Count tokens ahead
        const tokensAhead = await Token.countDocuments({
            clinic: token.clinic._id,
            date: today,
            tokenNumber: { $lt: token.tokenNumber },
            status: 'WAITING',
        });

        res.json({
            hasActiveToken: true,
            data: {
                tokenNumber: token.tokenNumber,
                clinicId: token.clinic._id,
                clinicName: token.clinic.name,
                clinicAddress: token.clinic.address,
                currentToken,
                tokensAhead,
                status: token.status,
                estimatedWait: `${tokensAhead * 10} minutes`,
            },
        });
    } catch (error) {
        console.error('Get my token error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Doctor: Get token queue for their clinic
export const getDoctorTokenQueue = async (req, res) => {
    try {
        let doctorDoc = await Doctor.findOne({ user: req.user._id });
        if (!doctorDoc) {
            doctorDoc = await Doctor.create({ user: req.user._id });
        }

        if (!doctorDoc.clinic) {
            return res.status(400).json({
                message: 'No clinic linked to your profile. Please complete profile setup.',
            });
        }

        const clinic = await Clinic.findById(doctorDoc.clinic);
        if (!clinic) {
            return res.status(404).json({ message: 'Clinic not found' });
        }

        if (clinic.clinicType !== 'TOKEN') {
            return res.status(400).json({
                message: 'This clinic does not use token system',
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const currentToken = await Token.findOne({
            clinic: doctorDoc.clinic,
            date: today,
            status: 'CALLED',
        })
            .populate('patient', 'name email phone')
            .sort({ tokenNumber: 1 });

        const waitingTokens = await Token.find({
            clinic: doctorDoc.clinic,
            date: today,
            status: 'WAITING',
        })
            .populate('patient', 'name email phone')
            .sort({ tokenNumber: 1 });

        const completedCount = await Token.countDocuments({
            clinic: doctorDoc.clinic,
            date: today,
            status: 'COMPLETED',
        });

        res.status(200).json({
            success: true,
            data: {
                clinicName: clinic.name,
                currentToken: currentToken || null,
                waitingTokens,
                waitingCount: waitingTokens.length,
                completedCount,
            },
        });
    } catch (error) {
        console.error('Get doctor token queue error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Doctor: Advance to next token
export const advanceToken = async (req, res) => {
    try {
        let doctorDoc = await Doctor.findOne({ user: req.user._id });
        if (!doctorDoc) {
            doctorDoc = await Doctor.create({ user: req.user._id });
        }

        if (!doctorDoc.clinic) {
            return res.status(400).json({
                message: 'No clinic linked to your profile.',
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Mark current CALLED token as COMPLETED
        const currentServing = await Token.findOne({
            clinic: doctorDoc.clinic,
            date: today,
            status: 'CALLED',
        });

        if (currentServing) {
            currentServing.status = 'COMPLETED';
            await currentServing.save();
        }

        // Find next WAITING token and set to CALLED
        const nextToken = await Token.findOne({
            clinic: doctorDoc.clinic,
            date: today,
            status: 'WAITING',
        }).sort({ tokenNumber: 1 });

        if (nextToken) {
            nextToken.status = 'CALLED';
            await nextToken.save();
        }

        // Return updated queue
        const updatedCurrentToken = nextToken
            ? await Token.findById(nextToken._id).populate('patient', 'name email phone')
            : null;

        const waitingTokens = await Token.find({
            clinic: doctorDoc.clinic,
            date: today,
            status: 'WAITING',
        })
            .populate('patient', 'name email phone')
            .sort({ tokenNumber: 1 });

        const completedCount = await Token.countDocuments({
            clinic: doctorDoc.clinic,
            date: today,
            status: 'COMPLETED',
        });

        const clinic = await Clinic.findById(doctorDoc.clinic);

        // Emit real-time update to the specific clinic room
        try {
            const io = getIO();
            io.to(`clinic:${doctorDoc.clinic.toString()}`).emit('token:update', {
                currentToken: updatedCurrentToken || null,
                waitingTokens
            });
        } catch (socketError) {
            console.error('Socket emission error:', socketError);
            // Non-blocking, continue to send response
        }

        res.status(200).json({
            success: true,
            message: nextToken
                ? `Now serving Token #${nextToken.tokenNumber}`
                : 'No more patients in queue',
            data: {
                clinicName: clinic?.name || '',
                currentToken: updatedCurrentToken || null,
                waitingTokens,
                waitingCount: waitingTokens.length,
                completedCount,
            },
        });
    } catch (error) {
        console.error('Advance token error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Doctor: Get token details for consultation
export const getTokenDetails = async (req, res) => {
    try {
        const { tokenId } = req.params;

        let doctorDoc = await Doctor.findOne({ user: req.user._id });
        if (!doctorDoc) {
            doctorDoc = await Doctor.create({ user: req.user._id });
        }

        const token = await Token.findById(tokenId)
            .populate('patient', 'name email phone gender dateOfBirth address emergencyContact')
            .populate('clinic', 'name address');

        if (!token) {
            return res.status(404).json({ message: 'Token not found' });
        }

        // Verify this token belongs to doctor's clinic
        if (!doctorDoc.clinic || token.clinic._id.toString() !== doctorDoc.clinic.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this token' });
        }

        // Get past completed tokens for this patient at this clinic
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const pastTokens = await Token.find({
            patient: token.patient._id,
            clinic: token.clinic._id,
            status: 'COMPLETED',
            _id: { $ne: tokenId },
        })
            .sort({ date: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            data: {
                token,
                pastTokens,
            },
        });
    } catch (error) {
        console.error('Get token details error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Doctor: Complete token consultation
export const completeTokenConsultation = async (req, res) => {
    try {
        const { tokenId } = req.params;
        const { diagnosis, prescription, consultationNotes } = req.body;

        if (!diagnosis) {
            return res.status(400).json({ message: 'Diagnosis is required' });
        }

        let doctorDoc = await Doctor.findOne({ user: req.user._id });
        if (!doctorDoc) {
            doctorDoc = await Doctor.create({ user: req.user._id });
        }

        const token = await Token.findById(tokenId);
        if (!token) {
            return res.status(404).json({ message: 'Token not found' });
        }

        if (!doctorDoc.clinic || token.clinic.toString() !== doctorDoc.clinic.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this token' });
        }

        if (token.status !== 'CALLED') {
            return res.status(400).json({ message: 'Can only complete a CALLED (serving) token' });
        }

        token.diagnosis = diagnosis;
        token.prescription = prescription || '';
        token.consultationNotes = consultationNotes || '';
        token.status = 'COMPLETED';
        await token.save();

        // Emit real-time update
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const io = getIO();
            const waitingTokens = await Token.find({
                clinic: doctorDoc.clinic,
                date: today,
                status: 'WAITING',
            }).populate('patient', 'name email phone').sort({ tokenNumber: 1 });

            // Since we just completed the token, current serving is likely null until advanced
            // Or we could return the completed token. We'll return null to clear it.
            io.to(`clinic:${doctorDoc.clinic.toString()}`).emit('token:update', {
                currentToken: null,
                waitingTokens
            });
        } catch (socketError) {
            console.error('Socket emission error:', socketError);
        }

        res.status(200).json({
            success: true,
            message: 'Consultation completed successfully',
            data: token,
        });
    } catch (error) {
        console.error('Complete token consultation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
