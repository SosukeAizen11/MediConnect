import express from 'express';

import {
    initiatePayment,
    verifyRazorpayPayment,
} from '../controllers/payment.controller.js';

import { protect } from '../../auth/index.js';
import { authorize } from '../../../middleware/role.middleware.js';

const router = express.Router();

router.post(
    '/',
    protect,
    authorize('PATIENT'),
    initiatePayment
);

router.post(
    '/verify',
    protect,
    authorize('PATIENT'),
    verifyRazorpayPayment
);

export default router;