import {
    createOrder,
    verifyPayment,
    refundPayment,
} from './razorpay.gateway.js';

export const paymentGateway = {
    createOrder,
    verifyPayment,
    refundPayment,
};