import express from 'express';

import { getMyInvoices } from '../controllers/invoice.controller.js';

import { protect } from '../../auth/index.js';
import { authorize } from '../../../middleware/role.middleware.js';

const router = express.Router();

router.get(
    '/my',
    protect,
    authorize('PATIENT'),
    getMyInvoices
);

export default router;