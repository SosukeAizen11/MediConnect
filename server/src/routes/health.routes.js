import express from 'express';
import { config } from '../config/env.js';

const router = express.Router();

router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        env: config.NODE_ENV,
    });
});

export default router;
