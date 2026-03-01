import DoctorPost from '../models/post.model.js';

// Get all posts (public, sorted by newest first)
export const getPosts = async (req, res) => {
    try {
        const posts = await DoctorPost.find()
            .populate('author', 'name')
            .populate('clinic', 'name')
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
        const { title, content, imageUrl, clinicId } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        const post = new DoctorPost({
            author: req.user.id,
            clinic: clinicId || null,
            title,
            content,
            imageUrl: imageUrl || null,
        });

        await post.save();

        // Populate author and clinic for response
        await post.populate('author', 'name');
        if (post.clinic) {
            await post.populate('clinic', 'name');
        }

        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            data: post,
        });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ message: 'Server error' });
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
        const { title, content, imageUrl } = req.body;

        const post = await DoctorPost.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to edit this post' });
        }

        if (title !== undefined) post.title = title;
        if (content !== undefined) post.content = content;
        if (imageUrl !== undefined) post.imageUrl = imageUrl || null;

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
