import Token from '../models/token.model.js';
import Clinic from '../models/clinic.model.js';

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

        // Count tokens ahead
        const tokensAhead = await Token.countDocuments({
            clinic: clinicId,
            date: today,
            tokenNumber: { $lt: nextTokenNumber },
            status: 'WAITING',
        });

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

        // Get current token being served (lowest WAITING or CALLED token)
        const currentServingToken = await Token.findOne({
            clinic: token.clinic._id,
            date: today,
            status: 'CALLED',
        }).sort({ tokenNumber: 1 });

        // If no one is being called, get the last completed
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
