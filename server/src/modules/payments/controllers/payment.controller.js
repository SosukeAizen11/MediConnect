import {
    createPayment,
    verifyPayment,
} from '../index.js';

export const initiatePayment = async (req, res, next) => {
    try {
        const { invoiceId } = req.body;
        const idempotencyKey = req.headers['idempotency-key'];

        const payment = await createPayment({
            invoiceId,
            patientId: req.user._id,
            idempotencyKey,
        });

        res.status(201).json({
            success: true,
            payment,
        });
    } catch (error) {
        next(error);
    }
};

export const verifyRazorpayPayment = async (req, res, next) => {
    try {
        const {
            paymentId,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
        } = req.body;

        const payment = await verifyPayment({
            paymentId,
            patientId: req.user._id,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
        });

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            payment,
        });
    } catch (error) {
        next(error);
    }
};