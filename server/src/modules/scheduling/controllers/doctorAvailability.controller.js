import * as doctorRepository from '../../../repositories/doctor.repository.js';
import * as doctorAvailabilityService from '../services/doctorAvailability.service.js';

// Create availability
// Only for logged-in doctor
export const createAvailability = async (req, res) => {
    try {
        const { dayOfWeek, startTime, endTime, slotDuration } = req.body;

        const doctorProfile = await doctorRepository.findByUserId(req.user._id || req.user.id);
        if (!doctorProfile) {
            return res.status(404).json({
                success: false,
                message: 'Doctor profile not found',
            });
        }

        const availability = await doctorAvailabilityService.createAvailability({
            doctorProfileId: doctorProfile._id,
            dayOfWeek,
            startTime,
            endTime,
            slotDuration,
        });

        res.status(201).json({
            success: true,
            data: availability,
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
            message: 'Failed to create availability',
            error: error.message,
        });
    }
};

// Get all availability entries for logged-in doctor
export const getMyAvailability = async (req, res) => {
    try {
        const doctorProfile = await doctorRepository.findByUserId(req.user._id || req.user.id);
        if (!doctorProfile) {
            return res.status(404).json({
                success: false,
                message: 'Doctor profile not found',
            });
        }

        const availabilities = await doctorAvailabilityService.getMyAvailability(doctorProfile._id);

        res.status(200).json({
            success: true,
            data: availabilities,
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
            message: 'Failed to fetch availability',
            error: error.message,
        });
    }
};

// Update availability
export const updateAvailability = async (req, res) => {
    try {
        const { startTime, endTime, slotDuration } = req.body;
        const { id } = req.params;

        const doctorProfile = await doctorRepository.findByUserId(req.user._id || req.user.id);
        if (!doctorProfile) {
            return res.status(404).json({
                success: false,
                message: 'Doctor profile not found',
            });
        }

        const availability = await doctorAvailabilityService.updateAvailability({
            availabilityId: id,
            doctorProfileId: doctorProfile._id,
            startTime,
            endTime,
            slotDuration,
        });

        res.status(200).json({
            success: true,
            data: availability,
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
            message: 'Failed to update availability',
            error: error.message,
        });
    }
};

// Delete availability (Soft delete)
export const deleteAvailability = async (req, res) => {
    try {
        const { id } = req.params;

        const doctorProfile = await doctorRepository.findByUserId(req.user._id || req.user.id);
        if (!doctorProfile) {
            return res.status(404).json({
                success: false,
                message: 'Doctor profile not found',
            });
        }

        await doctorAvailabilityService.deleteAvailability({
            availabilityId: id,
            doctorProfileId: doctorProfile._id,
        });

        res.status(200).json({
            success: true,
            data: {},
            message: 'Availability deleted successfully',
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
            message: 'Failed to delete availability',
            error: error.message,
        });
    }
};
