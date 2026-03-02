import express from 'express';
import { getPosts, createPost, getMyPosts, updatePost, deletePost, toggleLike, addComment, deleteComment } from '../controllers/post.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

// Get all posts (public - any authenticated user)
router.get('/', protect, getPosts);

// Get doctor's own posts
router.get('/my', protect, authorize('DOCTOR'), getMyPosts);

// Create a post (DOCTOR only)
router.post('/', protect, authorize('DOCTOR'), upload.single('image'), createPost);

// Update a post (DOCTOR only)
router.put('/:postId', protect, authorize('DOCTOR'), upload.single('image'), updatePost);

// Delete a post (DOCTOR only)
router.delete('/:postId', protect, authorize('DOCTOR'), deletePost);

// Toggle like on a post (Any authenticated user)
router.put('/:id/like', protect, toggleLike);

// Add comment to a post (Any authenticated user)
router.post('/:id/comment', protect, addComment);

// Delete a comment
router.delete('/:postId/comment/:commentId', protect, deleteComment);

export default router;
