import { useState, useEffect } from 'react';
import { getPosts, toggleLike, addComment, deleteComment } from '../../api/post.api';
import { useAuthContext } from '../../context/AuthContext';
import {
    Heart,
    MessageCircle,
    Bookmark,
    MoreHorizontal,
    Loader2,
    ImageOff,
    Trash2,
} from 'lucide-react';
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

function Feed() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentInputs, setCommentInputs] = useState({});
    const [submittingComment, setSubmittingComment] = useState(null);
    const [openComments, setOpenComments] = useState(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await getPosts();
                setPosts(response.data || []);
            } catch (err) {
                console.error('Failed to fetch posts:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    const { user } = useAuthContext();

    // Time ago helper
    const getTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        const intervals = [
            { label: 'year', seconds: 31536000 },
            { label: 'month', seconds: 2592000 },
            { label: 'week', seconds: 604800 },
            { label: 'day', seconds: 86400 },
            { label: 'hour', seconds: 3600 },
            { label: 'minute', seconds: 60 },
        ];

        for (const interval of intervals) {
            const count = Math.floor(seconds / interval.seconds);
            if (count >= 1) {
                return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
            }
        }
        return 'Just now';
    };

    const handleLike = async (postId) => {
        const currentUserIdStr = (user?._id || user?.id)?.toString();
        if (!currentUserIdStr) return;
        try {
            const res = await toggleLike(postId);

            setPosts((prevPosts) =>
                prevPosts.map((post) => {
                    if (post._id !== postId) return post;

                    return {
                        ...post,
                        likes: res.updatedLikesArray || post.likes,
                    };
                })
            );
        } catch (err) {
            console.error('Failed to toggle like:', err);
        }
    };

    const handleAddComment = async (postId, e) => {
        e?.preventDefault();
        const text = commentInputs[postId]?.trim();
        if (!text) return;

        setSubmittingComment(postId);
        try {
            const res = await addComment(postId, text);
            if (res.success) {
                // Update local post state with the new comments array functionally
                setPosts((prevPosts) => prevPosts.map(post => {
                    if (post._id === postId) {
                        return { ...post, comments: res.updatedComments || res.comments };
                    }
                    return post;
                }));
                // Clear the input
                setCommentInputs(prev => ({ ...prev, [postId]: '' }));
            }
        } catch (error) {
            console.error('Failed to add comment:', error);
        } finally {
            setSubmittingComment(null);
        }
    };

    const toggleComments = (postId) => {
        setOpenComments((prev) => (prev === postId ? null : postId));
    };

    const handleDeleteComment = async (postId, commentId) => {
        try {
            const res = await deleteComment(postId, commentId);
            if (res.success) {
                setPosts((prevPosts) => prevPosts.map(post => {
                    if (post._id === postId) {
                        return { ...post, comments: res.updatedComments };
                    }
                    return post;
                }));
            }
        } catch (error) {
            console.error('Failed to delete comment:', error);
            toast.error('Failed to delete comment');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
                <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
                <div className="space-y-4 w-full max-w-[600px] mt-8 opacity-50">
                    <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[600px] mx-auto py-6 sm:py-8 space-y-8">
            {posts.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <ImageOff className="w-10 h-10 text-gray-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        No posts yet
                    </h2>
                    <p className="text-gray-500 font-medium max-w-sm">
                        When doctors you follow share health tips and updates, they'll appear here.
                    </p>
                </div>
            ) : (
                /* Feed Stream */
                <div className="space-y-8 sm:space-y-10">
                    {posts.map((post) => {
                        const currentUserIdStr = (user?._id || user?.id)?.toString();
                        const isLiked = post.likes?.some(
                            (id) => id.toString() === currentUserIdStr
                        ) || false;

                        return (
                            <article
                                key={post._id}
                                className="bg-white rounded-none sm:rounded-xl border-y sm:border border-gray-200 shadow-sm overflow-hidden transition-shadow hover:shadow-md"
                            >
                                {/* Post Header */}
                                <div className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        {/* Avatar circle */}
                                        <div className="w-10 h-10 bg-linear-to-tr from-emerald-500 to-blue-500 rounded-full p-[2px]">
                                            <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden border border-white">
                                                <span className="text-sm font-bold text-gray-700">
                                                    {post.author?.name ? post.author.name.charAt(0).toUpperCase() : 'D'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="font-semibold text-gray-900 text-[15px] leading-tight hover:text-gray-600 cursor-pointer">
                                                Dr. {post.author?.name || 'Unknown'}
                                            </p>
                                            {post.clinic && (
                                                <p className="text-xs text-gray-500 font-medium">
                                                    {post.clinic.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button className="p-2 text-gray-500 hover:text-gray-900 transition-colors">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Post Image */}
                                {post.image && (
                                    <div className="w-full bg-gray-100 max-h-[500px] overflow-hidden flex items-center justify-center">
                                        <img
                                            src={post.image}
                                            alt={post.title}
                                            className="w-full max-h-[500px] object-cover"
                                            loading="lazy"
                                        />
                                    </div>
                                )}

                                {/* Post Actions Row */}
                                <div className="p-4 pb-2">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => handleLike(post._id)}
                                                className="transition-colors group focus:outline-none"
                                            >
                                                <Heart className={`w-[26px] h-[26px] transition-all duration-200 group-hover:scale-110 active:scale-95 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                                            </button>
                                            <button
                                                onClick={() => toggleComments(post._id)}
                                                className="text-gray-800 hover:text-gray-500 transition-colors group focus:outline-none"
                                            >
                                                <MessageCircle className={`w-[26px] h-[26px] transition-transform duration-200 group-hover:scale-110 active:scale-95 ${openComments === post._id ? 'text-blue-500' : ''}`} />
                                            </button>
                                        </div>
                                        <button className="text-gray-800 hover:text-gray-500 transition-colors group">
                                            <Bookmark className="w-[26px] h-[26px] group-hover:scale-110 transition-transform" />
                                        </button>
                                    </div>

                                    {/* Post Likes Counter */}
                                    <p className="font-semibold text-gray-900 text-sm mb-2">
                                        {post.likes?.length || 0} likes
                                    </p>

                                    {/* Post Caption & Content */}
                                    <div className="text-sm mb-2">
                                        <span className="font-semibold text-gray-900 mr-2">
                                            Dr. {post.author?.name || 'Unknown'}
                                        </span>
                                        {post.title && (
                                            <span className="font-medium text-gray-800 mr-2">
                                                {post.title} —
                                            </span>
                                        )}
                                        <span className="text-gray-800 whitespace-pre-wrap">
                                            {post.content}
                                        </span>
                                    </div>

                                    {/* Comments & Time */}
                                    {post.comments?.length > 0 && (
                                        <div className="mb-2">
                                            <button
                                                onClick={() => toggleComments(post._id)}
                                                className="text-sm text-gray-500 hover:text-gray-400 font-medium block focus:outline-none"
                                            >
                                                View all {post.comments.length} comment{post.comments.length !== 1 ? 's' : ''}
                                            </button>

                                            {/* Expandable Comments Section */}
                                            {openComments === post._id && (
                                                <div className="mt-2 space-y-2">
                                                    {post.comments.map((comment) => (
                                                        <div key={comment._id} className="text-sm flex items-start justify-between group/comment">
                                                            <div>
                                                                <span className="font-semibold text-gray-900 mr-2">
                                                                    {comment.user?.name || "User"}
                                                                </span>
                                                                <span className="text-gray-800">
                                                                    {comment.text}
                                                                </span>
                                                                <span className="text-[11px] text-gray-400 font-medium tracking-wide ml-2">
                                                                    {comment.createdAt ? dayjs(comment.createdAt).fromNow() : ''}
                                                                </span>
                                                            </div>
                                                            {((user?._id || user?.id)?.toString() === (comment.user?._id || comment.user)?.toString()) && (
                                                                <button
                                                                    onClick={() => handleDeleteComment(post._id, comment._id)}
                                                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover/comment:opacity-100 transition-all duration-200"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {/* Inline Add Comment Input */}
                                                    <form
                                                        onSubmit={(e) => handleAddComment(post._id, e)}
                                                        className="flex gap-2 mt-3 items-center"
                                                    >
                                                        <input
                                                            type="text"
                                                            placeholder="Add a comment..."
                                                            value={commentInputs[post._id] || ''}
                                                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                                                            className="flex-1 border border-gray-200 rounded-full px-3 py-1.5 text-sm outline-none focus:border-blue-300 transition-colors"
                                                            disabled={submittingComment === post._id}
                                                        />
                                                        <button
                                                            type="submit"
                                                            disabled={!(commentInputs[post._id]?.trim()) || submittingComment === post._id}
                                                            className="text-blue-500 h-full text-sm font-semibold opacity-70 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center px-1"
                                                        >
                                                            {submittingComment === post._id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : 'Post'}
                                                        </button>
                                                    </form>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mt-1">
                                        {getTimeAgo(post.createdAt)}
                                    </p>
                                </div>

                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default Feed;
