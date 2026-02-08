import { useState, useEffect } from 'react';
import { getPosts } from '../../api/post.api';
import {
    Stethoscope,
    Building2,
    Clock,
    Loader2,
    Newspaper,
} from 'lucide-react';

function DoctorFeed() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-800">Doctor Updates</h1>
                <p className="text-gray-600 mt-1">
                    Health tips, announcements, and medical updates
                </p>
            </div>

            {/* Feed Container */}
            <div className="max-w-2xl mx-auto space-y-5">
                {posts.length === 0 ? (
                    /* Empty State */
                    <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Newspaper className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">
                            No posts yet
                        </h2>
                        <p className="text-gray-600">
                            Check back later for health tips and updates from doctors
                        </p>
                    </div>
                ) : (
                    /* Posts */
                    posts.map((post) => (
                        <article
                            key={post._id}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                        >
                            {/* Post Header */}
                            <div className="p-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Stethoscope className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800">
                                            Dr. {post.author?.name || 'Unknown'}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            {post.clinic && (
                                                <>
                                                    <Building2 className="w-3 h-3" />
                                                    <span>{post.clinic.name}</span>
                                                    <span>•</span>
                                                </>
                                            )}
                                            <Clock className="w-3 h-3" />
                                            <span>{getTimeAgo(post.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Post Image */}
                            {post.imageUrl && (
                                <div className="aspect-video bg-gray-100">
                                    <img
                                        src={post.imageUrl}
                                        alt={post.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            {/* Post Content */}
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-800 text-lg mb-2">
                                    {post.title}
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                                    {post.content}
                                </p>
                            </div>
                        </article>
                    ))
                )}
            </div>
        </div>
    );
}

export default DoctorFeed;
