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
