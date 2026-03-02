import { useState, useEffect, useCallback, useRef } from 'react';
import { getMyPosts, updatePost, deletePost } from '../../api/post.api';
import {
    Newspaper,
    Pencil,
    Trash2,
    Calendar,
    Image as ImageIcon,
    Loader2,
    CheckCircle2,
    AlertCircle,
    X,
    Save,
    PenSquare,
    UploadCloud
} from 'lucide-react';

function MyPosts() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    // Edit modal state
    const [editingPost, setEditingPost] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', content: '', image: null });
    const [imagePreview, setImagePreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);

    // Delete modal state
    const [deletingPost, setDeletingPost] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchPosts = useCallback(async () => {
        try {
            setError(null);
            const res = await getMyPosts();
            setPosts(res.data || []);
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
            image: null,
        });
        setImagePreview(post.image || '');
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEditForm((prev) => ({ ...prev, image: file }));
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleEditSave = async () => {
        if (!editForm.title.trim() || !editForm.content.trim()) {
            setToast({ type: 'error', message: 'Title and content are required' });
            return;
        }
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('title', editForm.title);
            formData.append('content', editForm.content);
            if (editForm.image) {
                formData.append('image', editForm.image);
            }

            const res = await updatePost(editingPost._id, formData);
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
            <div className="flex items-center justify-center h-[70vh]">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border text-sm font-bold ${toast.type === 'success'
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
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 shadow-inner">
                        <Newspaper className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">Manage Posts</h1>
                        <p className="text-gray-500 font-medium text-sm mt-0.5">
                            Gallery view of your published content
                            <span className="ml-1 text-emerald-600 font-bold">
                                · {posts.length} Post{posts.length !== 1 ? 's' : ''}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-3 text-red-700 font-semibold shadow-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Empty State */}
            {!error && posts.length === 0 && (
                <div className="bg-white rounded-2xl p-16 border border-gray-200 shadow-sm text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-gray-100">
                        <PenSquare className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-black text-2xl mb-2">
                        No posts published yet
                    </p>
                    <p className="text-gray-500 font-medium max-w-md mx-auto">
                        Share updates, health tips, and clinic news with your patients. Your publications will appear here.
                    </p>
                </div>
            )}

            {/* Grid Layout (Instagram-style) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-6">
                {posts.map((post) => (
                    <div
                        key={post._id}
                        className="group relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out"
                    >
                        {/* Image Container with square crop and Hover Overlay */}
                        <div className="relative w-full aspect-square bg-gray-50 overflow-hidden border-b border-gray-100">
                            {post.image ? (
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/400?text=No+Image';
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                    <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                                    <span className="text-sm font-bold">No Image</span>
                                </div>
                            )}

                            {/* Hover Overlay Buttons */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-5 backdrop-blur-[2px]">
                                <button
                                    onClick={() => openEdit(post)}
                                    className="p-4 bg-white text-gray-800 rounded-full hover:scale-110 hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-xl"
                                    title="Edit Post"
                                >
                                    <Pencil className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setDeletingPost(post)}
                                    className="p-4 bg-white text-gray-800 rounded-full hover:scale-110 hover:bg-red-50 hover:text-red-600 transition-all shadow-xl"
                                    title="Delete Post"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Card Content Below Image */}
                        <div className="p-5 flex flex-col grow bg-white">
                            <h3 className="text-lg font-black text-gray-900 line-clamp-1 mb-2 tracking-tight" title={post.title}>
                                {post.title}
                            </h3>
                            <p className="text-sm text-gray-600 font-medium line-clamp-2 mb-4 grow leading-relaxed">
                                {post.content}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-400 font-bold pt-4 border-t border-gray-100 mt-auto uppercase tracking-wide">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {editingPost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => !saving && setEditingPost(null)}
                    />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 bg-gray-50/80 backdrop-blur-md">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                <Pencil className="w-5 h-5 text-emerald-600" />
                                Edit Post
                            </h3>
                            <button
                                onClick={() => !saving && setEditingPost(null)}
                                className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-7 space-y-6 overflow-y-auto flex-1">
                            {/* Image Replacement Area */}
                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block uppercase tracking-wider">
                                    Post Cover
                                </label>
                                <div className="relative group rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-emerald-400 transition-colors shadow-inner">
                                    {imagePreview ? (
                                        <>
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-56 object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="px-5 py-2.5 bg-white text-gray-900 text-sm font-bold rounded-xl hover:bg-emerald-50 hover:text-emerald-700 shadow-xl flex items-center gap-2 transition-colors transform hover:scale-105 active:scale-95"
                                                >
                                                    <UploadCloud className="w-4 h-4" />
                                                    Change Image
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div
                                            className="w-full h-48 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-3 shadow-sm">
                                                <ImageIcon className="w-7 h-7 text-emerald-600" />
                                            </div>
                                            <span className="text-sm font-black text-emerald-700">Upload New Image</span>
                                            <span className="text-xs text-gray-500 font-medium mt-1">Click to browse your device</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageChange}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block uppercase tracking-wider">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={(e) =>
                                        setEditForm((f) => ({ ...f, title: e.target.value }))
                                    }
                                    className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl text-[15px] font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-gray-50 hover:bg-white"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block uppercase tracking-wider">
                                    Caption
                                </label>
                                <textarea
                                    value={editForm.content}
                                    onChange={(e) =>
                                        setEditForm((f) => ({ ...f, content: e.target.value }))
                                    }
                                    rows={5}
                                    className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl text-[15px] font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-gray-50 hover:bg-white resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 px-7 py-5 border-t border-gray-100 bg-gray-50 shrink-0">
                            <button
                                onClick={() => setEditingPost(null)}
                                disabled={saving}
                                className="px-6 py-3 text-sm font-black text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-8 py-3 text-sm font-black text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                            >
                                {saving ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5" />
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
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => !deleting && setDeletingPost(null)}
                    />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-8 text-center bg-red-50/50">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-red-100">
                                <Trash2 className="w-10 h-10 text-red-500" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
                                Delete Post?
                            </h3>
                            <p className="text-[15px] text-gray-600 font-medium leading-relaxed">
                                Are you sure you want to delete <br />
                                <span className="text-gray-900 font-bold mt-2 inline-block px-3 py-1 bg-white rounded-lg shadow-sm border border-gray-100">"{deletingPost.title}"</span><br />
                                <span className="text-red-500 text-[11px] uppercase tracking-widest font-black mt-4 block">Cannot be undone</span>
                            </p>
                        </div>
                        <div className="flex gap-3 px-6 py-5 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={() => setDeletingPost(null)}
                                disabled={deleting}
                                className="flex-1 px-4 py-3 text-[15px] font-black text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-50 shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-[15px] font-black text-white bg-red-600 rounded-xl hover:bg-red-500 hover:shadow-lg hover:shadow-red-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                            >
                                {deleting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    "Delete It"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyPosts;
