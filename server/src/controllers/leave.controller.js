import DoctorLeave from '../models/doctorLeave.model.js';

// GET /api/v1/leaves — all leaves for logged-in doctor
export const getMyLeaves = async (req, res) => {
    try {
        const leaves = await DoctorLeave.find({
            doctor: req.user.id,
        }).sort({ date: 1 });

        res.status(200).json({
            success: true,
            data: leaves,
        });
    } catch (error) {
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

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date is required',
            });
        }

        // Check for duplicate
        const existing = await DoctorLeave.findOne({
            doctor: req.user.id,
            date,
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Leave already exists for this date',
            });
        }

        const leave = await DoctorLeave.create({
            doctor: req.user.id,
            date,
            reason: reason || '',
        });

        res.status(201).json({
            success: true,
            data: leave,
        });
    } catch (error) {
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

        const leave = await DoctorLeave.findOne({
            _id: id,
            doctor: req.user.id,
        });

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave not found',
            });
        }

        await DoctorLeave.deleteOne({ _id: id });

        res.status(200).json({
            success: true,
            message: 'Leave deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete leave',
            error: error.message,
        });
    }
};
