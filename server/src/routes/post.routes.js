import express from 'express';
import { getPosts, createPost } from '../controllers/post.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

// Get all posts (public - any authenticated user)
router.get('/', protect, getPosts);

// Create a post (DOCTOR only)
router.post('/', protect, authorize('DOCTOR'), createPost);

export default router;
