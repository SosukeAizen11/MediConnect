import express from 'express';
import { chatWithReceptionist } from '../controllers/aiReceptionist.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/chat', protect, chatWithReceptionist);

export default router;
