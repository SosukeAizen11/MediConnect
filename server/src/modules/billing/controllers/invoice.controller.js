import { getPatientInvoices } from '../index.js';

export const getMyInvoices = async (req, res, next) => {
    try {
        const invoices = await getPatientInvoices(req.user._id);

        res.status(200).json({
            success: true,
            invoices,
        });
    } catch (error) {
        next(error);
    }
};