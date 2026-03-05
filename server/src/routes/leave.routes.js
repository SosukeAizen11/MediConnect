import express from 'express';
import { getMyLeaves, createLeave, deleteLeave } from '../controllers/leave.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

router.get('/', protect, authorize('DOCTOR'), getMyLeaves);
router.post('/', protect, authorize('DOCTOR'), createLeave);
router.delete('/:id', protect, authorize('DOCTOR'), deleteLeave);

export default router;
