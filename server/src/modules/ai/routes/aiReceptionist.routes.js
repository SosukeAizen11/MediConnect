import express from 'express';
import { chatWithReceptionist } from '../controllers/aiReceptionist.controller.js';
import { protect } from '../../auth/index.js';

const router = express.Router();

router.post('/chat', protect, chatWithReceptionist);

export default router;
