import DoctorAvailability from "../models/doctorAvailability.model.js";

// Create availability
// Only for logged-in doctor
export const createAvailability = async (req, res) => {
    try {
        const { dayOfWeek, startTime, endTime, slotDuration } = req.body;

        // Ensure endTime > startTime
        if (startTime >= endTime) {
            return res.status(400).json({
                success: false,
                message: "End time must be after start time",
            });
        }

        // Prevent duplicate dayOfWeek for same doctor
        const existingAvailability = await DoctorAvailability.findOne({
            doctor: req.user.id,
            dayOfWeek,
            isActive: true,
        });

        if (existingAvailability) {
            return res.status(400).json({
                success: false,
                message: "Availability for this day already exists",
            });
        }

        // Save availability
        const availability = await DoctorAvailability.create({
            doctor: req.user.id,
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
        res.status(500).json({
            success: false,
            message: "Failed to create availability",
            error: error.message,
        });
    }
};

// Get all availability entries for logged-in doctor
export const getMyAvailability = async (req, res) => {
    try {
        // Return all active availability entries for logged-in doctor
        const availabilities = await DoctorAvailability.find({
            doctor: req.user.id,
            isActive: true,
        }).sort({ dayOfWeek: 1 });

        res.status(200).json({
            success: true,
            data: availabilities,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch availability",
            error: error.message,
        });
    }
};

// Update availability
export const updateAvailability = async (req, res) => {
    try {
        const { startTime, endTime, slotDuration } = req.body;
        const { id } = req.params;

        const availability = await DoctorAvailability.findOne({
            _id: id,
            doctor: req.user.id,
            isActive: true,
        });

        if (!availability) {
            return res.status(404).json({
                success: false,
                message: "Availability not found",
            });
        }

        // Ensure endTime > startTime
        if (startTime && endTime) {
            if (startTime >= endTime) {
                return res.status(400).json({
                    success: false,
                    message: "End time must be after start time",
                });
            }
        } else if (startTime) {
            if (startTime >= availability.endTime) {
                return res.status(400).json({
                    success: false,
                    message: "Start time must be before end time",
                });
            }
        } else if (endTime) {
            if (availability.startTime >= endTime) {
                return res.status(400).json({
                    success: false,
                    message: "End time must be after start time",
                });
            }
        }

        // Update fields
        availability.startTime = startTime || availability.startTime;
        availability.endTime = endTime || availability.endTime;
        availability.slotDuration = slotDuration || availability.slotDuration;

        await availability.save();

        res.status(200).json({
            success: true,
            data: availability,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update availability",
            error: error.message,
        });
    }
};

// Delete availability (Soft delete)
export const deleteAvailability = async (req, res) => {
    try {
        const { id } = req.params;

        const availability = await DoctorAvailability.findOne({
            _id: id,
            doctor: req.user.id,
            isActive: true,
        });

        if (!availability) {
            return res.status(404).json({
                success: false,
                message: "Availability not found",
            });
        }

        // Soft delete by setting isActive false
        availability.isActive = false;
        await availability.save();

        res.status(200).json({
            success: true,
            data: {},
            message: "Availability deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete availability",
            error: error.message,
        });
    }
};
