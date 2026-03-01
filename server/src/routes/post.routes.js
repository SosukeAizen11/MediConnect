import express from 'express';
import { getPosts, createPost, getMyPosts, updatePost, deletePost } from '../controllers/post.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

// Get all posts (public - any authenticated user)
router.get('/', protect, getPosts);

// Get doctor's own posts
router.get('/my', protect, authorize('DOCTOR'), getMyPosts);

// Create a post (DOCTOR only)
router.post('/', protect, authorize('DOCTOR'), createPost);

// Update a post (DOCTOR only)
router.put('/:postId', protect, authorize('DOCTOR'), updatePost);

// Delete a post (DOCTOR only)
router.delete('/:postId', protect, authorize('DOCTOR'), deletePost);

export default router;
