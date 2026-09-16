import { getAvailableSlots as fetchAvailableSlots } from '../modules/scheduling/index.js';

export const getAvailableSlots = async (req, res, next) => {
    try {
        const { doctorId, date } = req.query;

        if (!doctorId || !date) {
            return res.status(400).json({
                success: false,
                message: 'doctorId and date are required',
            });
        }

        const { slots, onLeave } = await fetchAvailableSlots(doctorId, date);

        return res.status(200).json({
            success: true,
            ...(onLeave && { message: 'Doctor on leave' }),
            slots,
        });
    } catch (error) {
        next(error);
    }
};
