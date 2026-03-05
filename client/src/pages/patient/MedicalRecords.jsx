import { useState, useEffect, useCallback } from 'react';
import {
    FileText,
    Upload,
    File,
    Image,
    Calendar,
    Eye,
    Trash2,
    Loader2,
    CheckCircle,
    AlertCircle,
    X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { uploadReport, getMyReports, deleteReport } from '../../api/report.api';

function MedicalRecords() {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);
    const [title, setTitle] = useState('');
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [toast, setToast] = useState(null);

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

    const fetchReports = useCallback(async () => {
        try {
            setLoadingReports(true);
            const res = await getMyReports();
            setReports(res.reports || []);
        } catch (error) {
            setToast({
                type: 'error',
                message: error.response?.data?.message || 'Failed to fetch reports',
            });
        } finally {
            setLoadingReports(false);
        }
    }, []);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!allowedTypes.includes(file.type)) {
                setToast({ type: 'error', message: 'Please upload PDF, JPG, or PNG files only' });
                setSelectedFile(null);
                e.target.value = ''; // reset
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setToast({ type: 'error', message: 'File size must be less than 10MB' });
                setSelectedFile(null);
                e.target.value = ''; // reset
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            setToast({ type: 'error', message: 'Please select a file to upload' });
            return;
        }
        if (!title.trim()) {
            setToast({ type: 'error', message: 'Please enter a report title' });
            return;
        }

        setUploading(true);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('file', selectedFile);

        try {
            await uploadReport(formData);
            setToast({ type: 'success', message: 'Report uploaded successfully' });

            // Reset form
            setSelectedFile(null);
            setTitle('');
            const fileInput = document.getElementById('file-input');
            if (fileInput) fileInput.value = '';

            // Map data
            await fetchReports();
        } catch (error) {
            setToast({
                type: 'error',
                message: error.response?.data?.message || 'Failed to upload report',
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this report?')) return;

        setDeletingId(id);
        try {
            await deleteReport(id);
            setToast({ type: 'success', message: 'Report deleted successfully' });
            await fetchReports();
        } catch (error) {
            setToast({
                type: 'error',
                message: error.response?.data?.message || 'Failed to delete report',
            });
        } finally {
            setDeletingId(null);
        }
    };

    const getFileIcon = (type) => {
        if (type === 'pdf') return File;
        if (['jpg', 'jpeg', 'png'].includes(type)) return Image;
        return FileText;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg border text-sm font-medium ${toast.type === 'success'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-red-50 border-red-200 text-red-700'
                        }`}
                >
                    {toast.type === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    {toast.message}
                </div>
            )}

            {/* Page Header */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-800">Medical Reports</h1>
                <p className="text-gray-600 mt-1">
                    Upload and manage your medical documents
                </p>
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload New Report</h2>

                <form onSubmit={handleUpload} className="space-y-4">
                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                            Report Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Blood test report, X-ray scan..."
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* File Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select File <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="file"
                                id="file-input"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <label
                                htmlFor="file-input"
                                className="flex items-center justify-center gap-3 w-full p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                            >
                                <Upload className="w-6 h-6 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                    {selectedFile
                                        ? selectedFile.name
                                        : 'Click to upload PDF, JPG, or PNG (Max 10MB)'}
                                </span>
                            </label>
                        </div>
                        {selectedFile && (
                            <div className="mt-2 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <File className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-700">{selectedFile.name}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedFile(null);
                                        const fileInput = document.getElementById('file-input');
                                        if (fileInput) fileInput.value = '';
                                    }}
                                    className="p-1 hover:bg-gray-200 text-gray-500 hover:text-red-500 rounded"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Upload Button */}
                    <button
                        type="submit"
                        disabled={uploading || !selectedFile || !title.trim()}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-5 h-5" />
                                Upload Report
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Records List */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Reports</h2>

                {loadingReports ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">No medical records uploaded yet</p>
                        <p className="text-gray-400 text-sm mt-1">
                            Upload your medical documents to keep them organized
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {reports.map((report) => {
                            const FileIcon = getFileIcon(report.fileType);
                            const isDeleting = deletingId === report._id;

                            return (
                                <div
                                    key={report._id}
                                    className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                                            <FileIcon className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-gray-800 truncate" title={report.title}>
                                                {report.title}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>Uploaded: {formatDate(report.uploadedAt)}</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => navigate(`/report-viewer?url=${encodeURIComponent(report.fileUrl)}`)}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 border border-blue-200 bg-white rounded-lg hover:bg-blue-50 transition-colors"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            View
                                        </button>
                                        <button
                                            onClick={() => handleDelete(report._id)}
                                            disabled={isDeleting}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 border border-red-200 bg-white rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                        >
                                            {isDeleting ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-3.5 h-3.5" />
                                            )}
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MedicalRecords;
