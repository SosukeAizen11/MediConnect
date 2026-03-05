import express from 'express';
import {
    uploadReport,
    getMyReports,
    getPatientReports,
    deleteReport,
} from '../controllers/report.controller.js';
import reportUpload from '../middleware/reportUpload.middleware.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

// Patient uploads report
router.post(
    '/',
    protect,
    authorize('PATIENT'),
    reportUpload.single('file'), // Multer middleware
    uploadReport
);

// Patient getting their own reports
router.get(
    '/my-reports',
    protect,
    authorize('PATIENT'),
    getMyReports
);

// Doctor getting a patient's reports
router.get(
    '/patient/:patientId',
    protect,
    authorize('DOCTOR'),
    getPatientReports
);

// Patient deletes their own report
router.delete(
    '/:id',
    protect,
    authorize('PATIENT'),
    deleteReport
);

export default router;
