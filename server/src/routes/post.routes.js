import express from 'express';
import { getPosts, createPost, getMyPosts, updatePost, deletePost, toggleLike, addComment, deleteComment } from '../controllers/post.controller.js';
import { protect } from '../modules/auth/index.js';
import { authorize } from '../middleware/role.middleware.js';
import upload from '../middleware/upload.middleware.js';
import { requireApprovedClinic } from '../middleware/approvedClinic.middleware.js';
const router = express.Router();

// Get all posts (public - any authenticated user)
router.get('/', protect, getPosts);

router.get(
    '/my',
    protect,
    authorize('DOCTOR'),
    requireApprovedClinic,
    getMyPosts
);

router.post(
    '/',
    protect,
    authorize('DOCTOR'),
    requireApprovedClinic,
    upload.single('image'),
    createPost
);

router.put(
    '/:postId',
    protect,
    authorize('DOCTOR'),
    requireApprovedClinic,
    upload.single('image'),
    updatePost
);

router.delete(
    '/:postId',
    protect,
    authorize('DOCTOR'),
    requireApprovedClinic,
    deletePost
);

// Toggle like on a post (Any authenticated user)
router.put('/:id/like', protect, toggleLike);

// Add comment to a post (Any authenticated user)
router.post('/:id/comment', protect, addComment);

// Delete a comment
router.delete('/:postId/comment/:commentId', protect, deleteComment);

export default router;
