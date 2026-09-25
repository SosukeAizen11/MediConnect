/**
 * Posts Module Public Facade
 *
 * Minimal public API for the current posts domain.
 */

export {
    getPosts,
    createPost,
    getMyPosts,
    updatePost,
    deletePost,
    toggleLike,
    addComment,
    deleteComment,
    getPostCountByAuthor,
    getTotalPostCount,
} from './controllers/post.controller.js';
