import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../../api/post.api';
import { getDoctorProfile } from '../../api/doctor.api';
import {
    PenSquare,
    Type,
    FileText,
    Image,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Send,
} from 'lucide-react';

function CreatePost() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [clinicId, setClinicId] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        imageUrl: '',
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await getDoctorProfile();
                if (res.data?.clinic?._id) {
                    setClinicId(res.data.clinic._id);
                }
            } catch {
                // Clinic is optional
            }
        };
        fetchProfile();
    }, []);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            setToast({ type: 'error', message: 'Title is required' });
            return;
        }
        if (!formData.content.trim()) {
            setToast({ type: 'error', message: 'Content is required' });
            return;
        }

        setSaving(true);
        try {
            await createPost({
                title: formData.title,
                content: formData.content,
                imageUrl: formData.imageUrl || undefined,
                clinicId: clinicId || undefined,
            });
            setToast({ type: 'success', message: 'Post published successfully!' });
            setTimeout(() => navigate('/doctor/posts'), 1500);
        } catch (err) {
            setToast({
                type: 'error',
                message: err.response?.data?.message || 'Failed to publish post',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
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
                        <PenSquare className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Create Post</h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            Share updates with your patients
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
                <div className="p-6 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                            <Type className="w-4 h-4 text-emerald-500" />
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Post title..."
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            Content <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            rows={8}
                            placeholder="Write your post content here..."
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                        />
                    </div>

                    {/* Image URL */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                            <Image className="w-4 h-4 text-amber-500" />
                            Image URL
                            <span className="text-xs text-gray-400 font-normal">(optional)</span>
                        </label>
                        <input
                            type="url"
                            name="imageUrl"
                            value={formData.imageUrl}
                            onChange={handleChange}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        />
                        {formData.imageUrl && (
                            <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                                <img
                                    src={formData.imageUrl}
                                    alt="Preview"
                                    className="w-full h-48 object-cover"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        Publish Post
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CreatePost;
