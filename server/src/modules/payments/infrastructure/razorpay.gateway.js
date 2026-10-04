import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async ({
    paymentId,
    amount,
    currency,
}) => {
    if (!paymentId) {
        throw new Error('Payment ID is required');
    }

    if (!Number.isInteger(amount) || amount <= 0) {
        throw new Error('Payment amount must be a positive integer');
    }

    const order = await razorpay.orders.create({
        amount,
        currency,
        receipt: paymentId.toString(),
    });

    return order;
};

export const verifyPayment = ({
    orderId,
    paymentId,
    signature,
}) => {
    if (!orderId || !paymentId || !signature) {
        throw new Error('Payment verification data is incomplete');
    }

    const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

    return generatedSignature === signature;
};

export const refundPayment = async ({
    providerPaymentId,
    amount,
}) => {
    if (!providerPaymentId) {
        throw new Error('Provider payment ID is required');
    }

    if (!Number.isInteger(amount) || amount <= 0) {
        throw new Error('Refund amount must be a positive integer');
    }

    const refund = await razorpay.payments.refund(
        providerPaymentId,
        {
            amount,
        }
    );

    return refund;
};