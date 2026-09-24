import { findDoctorByUserId } from '../../identity/index.js';
import * as doctorLeaveService from '../services/doctorLeave.service.js';

// GET /api/v1/leaves — all leaves for logged-in doctor
export const getMyLeaves = async (req, res) => {
    try {
        const doctorProfile = await findDoctorByUserId(req.user._id || req.user.id);
        if (!doctorProfile) {
            return res.status(404).json({
                success: false,
                message: 'Doctor profile not found',
            });
        }

        const leaves = await doctorLeaveService.getMyLeaves(doctorProfile._id);

        res.status(200).json({
            success: true,
            data: leaves,
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to fetch leaves',
            error: error.message,
        });
    }
};

// POST /api/v1/leaves — create a leave
export const createLeave = async (req, res) => {
    try {
        const { date, reason } = req.body;

        const doctorProfile = await findDoctorByUserId(req.user._id || req.user.id);
        if (!doctorProfile) {
            return res.status(404).json({
                success: false,
                message: 'Doctor profile not found',
            });
        }

        const leave = await doctorLeaveService.createLeave({
            doctorProfileId: doctorProfile._id,
            date,
            reason,
        });

        res.status(201).json({
            success: true,
            data: leave,
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to create leave',
            error: error.message,
        });
    }
};

// DELETE /api/v1/leaves/:id — delete a leave
export const deleteLeave = async (req, res) => {
    try {
        const { id } = req.params;

        const doctorProfile = await findDoctorByUserId(req.user._id || req.user.id);
        if (!doctorProfile) {
            return res.status(404).json({
                success: false,
                message: 'Doctor profile not found',
            });
        }

        await doctorLeaveService.deleteLeave({
            leaveId: id,
            doctorProfileId: doctorProfile._id,
        });

        res.status(200).json({
            success: true,
            message: 'Leave deleted successfully',
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to delete leave',
            error: error.message,
        });
    }
};
