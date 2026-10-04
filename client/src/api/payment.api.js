import apiClient from './apiClient';

export const initiatePayment = async (invoiceId, idempotencyKey) => {
    const response = await apiClient.post(
        '/payments',
        { invoiceId },
        {
            headers: {
                'Idempotency-Key': idempotencyKey,
            },
        }
    );

    return response.data;
};

export const verifyPayment = async ({
    paymentId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
}) => {
    const response = await apiClient.post('/payments/verify', {
        paymentId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
    });

    return response.data;
};