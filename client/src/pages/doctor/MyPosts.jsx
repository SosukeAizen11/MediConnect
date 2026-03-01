import { useState, useEffect, useCallback } from 'react';
import { getMyPosts, updatePost, deletePost } from '../../api/post.api';
import {
    Newspaper,
    Pencil,
    Trash2,
    Calendar,
    Image,
    Loader2,
    CheckCircle2,
    AlertCircle,
    X,
    Save,
    PenSquare,
} from 'lucide-react';

function MyPosts() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    // Edit modal state
    const [editingPost, setEditingPost] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', content: '', imageUrl: '' });
    const [saving, setSaving] = useState(false);

    // Delete modal state
    const [deletingPost, setDeletingPost] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchPosts = useCallback(async () => {
        try {
            setError(null);
            const res = await getMyPosts();
            setPosts(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load posts');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    const openEdit = (post) => {
        setEditingPost(post);
        setEditForm({
            title: post.title,
            content: post.content,
            imageUrl: post.imageUrl || '',
        });
    };

    const handleEditSave = async () => {
        if (!editForm.title.trim() || !editForm.content.trim()) {
            setToast({ type: 'error', message: 'Title and content are required' });
            return;
        }
        setSaving(true);
        try {
            const res = await updatePost(editingPost._id, editForm);
            setPosts((prev) =>
                prev.map((p) => (p._id === editingPost._id ? res.data : p))
            );
            setEditingPost(null);
            setToast({ type: 'success', message: 'Post updated successfully' });
        } catch (err) {
            setToast({
                type: 'error',
                message: err.response?.data?.message || 'Failed to update post',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deletePost(deletingPost._id);
            setPosts((prev) => prev.filter((p) => p._id !== deletingPost._id));
            setDeletingPost(null);
            setToast({ type: 'success', message: 'Post deleted successfully' });
        } catch (err) {
            setToast({
                type: 'error',
                message: err.response?.data?.message || 'Failed to delete post',
            });
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg border text-sm font-medium ${toast.type === 'success'
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-red-50 border-red-200 text-red-700'
                        }`}
                >
                    {toast.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    {toast.message}
                </div>
            )}

            {/* Page Header */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                        <Newspaper className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">My Posts</h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            Manage your published content
                            <span className="ml-1 text-emerald-600 font-medium">
                                · {posts.length} post{posts.length !== 1 ? 's' : ''}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Empty State */}
            {!error && posts.length === 0 && (
                <div className="bg-white rounded-xl p-12 border border-gray-200 shadow-sm text-center">
                    <PenSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-semibold text-lg">
                        You haven't published any posts yet
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                        Create your first post to share updates with patients
                    </p>
                </div>
            )}

            {/* Post Cards */}
            <div className="space-y-4">
                {posts.map((post) => (
                    <div
                        key={post._id}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                    >
                        <div className="flex flex-col sm:flex-row">
                            {/* Image */}
                            {post.imageUrl && (
                                <div className="sm:w-48 h-40 sm:h-auto shrink-0">
                                    <img
                                        src={post.imageUrl}
                                        alt={post.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.parentElement.style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-lg font-bold text-gray-800 truncate">
                                            {post.title}
                                        </h3>
                                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                                            {post.content}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                                    <div className="flex items-center gap-3 text-xs text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(post.createdAt).toLocaleDateString()}
                                        </span>
                                        {post.clinic && (
                                            <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                                                {post.clinic.name}
                                            </span>
                                        )}
                                        {post.imageUrl && (
                                            <span className="flex items-center gap-1 text-blue-400">
                                                <Image className="w-3.5 h-3.5" />
                                                Image
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openEdit(post)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => setDeletingPost(post)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {editingPost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => !saving && setEditingPost(null)}
                    />
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800">Edit Post</h3>
                            <button
                                onClick={() => !saving && setEditingPost(null)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={(e) =>
                                        setEditForm((f) => ({ ...f, title: e.target.value }))
                                    }
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                                    Content
                                </label>
                                <textarea
                                    value={editForm.content}
                                    onChange={(e) =>
                                        setEditForm((f) => ({ ...f, content: e.target.value }))
                                    }
                                    rows={6}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                                    Image URL{' '}
                                    <span className="text-xs text-gray-400 font-normal">
                                        (optional)
                                    </span>
                                </label>
                                <input
                                    type="url"
                                    value={editForm.imageUrl}
                                    onChange={(e) =>
                                        setEditForm((f) => ({ ...f, imageUrl: e.target.value }))
                                    }
                                    placeholder="https://..."
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            <button
                                onClick={() => setEditingPost(null)}
                                disabled={saving}
                                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingPost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => !deleting && setDeletingPost(null)}
                    />
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm">
                        <div className="p-6 text-center">
                            <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-7 h-7 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-1">
                                Delete Post?
                            </h3>
                            <p className="text-sm text-gray-500">
                                Are you sure you want to delete "
                                <span className="font-medium text-gray-700">
                                    {deletingPost.title}
                                </span>
                                "? This cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            <button
                                onClick={() => setDeletingPost(null)}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyPosts;
