import DoctorPost from '../models/post.model.js';

// Get all posts (public, sorted by newest first)
export const getPosts = async (req, res) => {
    try {
        const posts = await DoctorPost.find()
            .populate('author', 'name')
            .populate('clinic', 'name')
            .populate('comments.user', 'name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: posts,
        });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create a new post (DOCTOR only)
export const createPost = async (req, res) => {
    try {
        console.log("FILE:", req.file);
        console.log("BODY:", req.body);

        const { title, content, clinicId } = req.body;

        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Title and content are required' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Image file is required' });
        }

        const post = new DoctorPost({
            author: req.user.id,
            clinic: clinicId || null,
            title,
            content,
            image: req.file.path,
        });

        await post.save();

        // Populate author and clinic for response
        await post.populate('author', 'name');
        if (post.clinic) {
            await post.populate('clinic', 'name');
        }

        return res.status(201).json({
            success: true,
            message: 'Post created successfully',
            data: post,
        });
    } catch (error) {
        console.error('Create post error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// Get doctor's own posts
export const getMyPosts = async (req, res) => {
    try {
        const posts = await DoctorPost.find({ author: req.user.id })
            .populate('author', 'name')
            .populate('clinic', 'name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: posts.length,
            data: posts,
        });
    } catch (error) {
        console.error('Get my posts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a post (DOCTOR only, must own)
export const updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { title, content } = req.body;

        const post = await DoctorPost.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to edit this post' });
        }

        if (title !== undefined) post.title = title;
        if (content !== undefined) post.content = content;
        if (req.file) post.image = req.file.path;

        await post.save();
        await post.populate('author', 'name');
        if (post.clinic) await post.populate('clinic', 'name');

        res.json({
            success: true,
            message: 'Post updated successfully',
            data: post,
        });
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a post (DOCTOR only, must own)
export const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;

        const post = await DoctorPost.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        await DoctorPost.findByIdAndDelete(postId);

        res.json({
            success: true,
            message: 'Post deleted successfully',
        });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Toggle like on a post (Authenticated users)
export const toggleLike = async (req, res) => {
    try {
        const { id } = req.params;

        console.log("User:", req.user._id);
        console.log("Post ID:", id);

        const post = await DoctorPost.findById(id);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const userId = req.user.id;
        const hasLiked = post.likes.includes(userId);

        const updateOperation = hasLiked
            ? { $pull: { likes: userId } }
            : { $addToSet: { likes: userId } };

        const updatedPost = await DoctorPost.findByIdAndUpdate(
            id,
            updateOperation,
            { new: true }
        );

        res.json({
            success: true,
            updatedLikesArray: updatedPost.likes,
        });
    } catch (error) {
        console.error('Toggle like error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Add comment to a post (Authenticated users)
export const addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;

        if (!text || text.trim() === '') {
            return res.status(400).json({ success: false, message: 'Comment text is required' });
        }

        const post = await DoctorPost.findById(id);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const newComment = {
            user: req.user._id,
            text: text.trim(),
        };

        const updatedPost = await DoctorPost.findByIdAndUpdate(
            id,
            { $push: { comments: newComment } },
            { new: true }
        );

        // Return only the new comments array (optionally populate user if needed later)
        res.status(201).json({
            success: true,
            updatedComments: updatedPost.comments,
        });

    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete a comment (Only author of the comment)
export const deleteComment = async (req, res) => {
    try {
        const { postId, commentId } = req.params;

        const post = await DoctorPost.findById(postId);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Find the specific comment
        const comment = post.comments.find(c => c._id.toString() === commentId);

        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        const currentUserIdStr = (req.user._id || req.user.id).toString();

        // Check if the authenticated user is the author of the comment
        if (comment.user.toString() !== currentUserIdStr) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
        }

        // Bypass validation on the document, since legacy posts lack image string
        const updatedPost = await DoctorPost.findByIdAndUpdate(
            postId,
            { $pull: { comments: { _id: commentId } } },
            { new: true }
        ).populate('comments.user', 'name');

        res.json({
            success: true,
            updatedComments: updatedPost.comments,
        });

    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
