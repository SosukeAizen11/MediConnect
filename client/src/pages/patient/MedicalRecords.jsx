import { useState } from 'react';
import {
    FileText,
    Upload,
    File,
    Image,
    Calendar,
    Download,
    Eye,
    Loader2,
    CheckCircle,
    AlertCircle,
    X,
} from 'lucide-react';

function MedicalRecords() {
    const [records, setRecords] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [error, setError] = useState('');

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!allowedTypes.includes(file.type)) {
                setError('Please upload PDF, JPG, or PNG files only');
                setSelectedFile(null);
                return;
            }
            setSelectedFile(file);
            setError('');
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            setError('Please select a file to upload');
            return;
        }

        setUploading(true);
        setError('');

        // Simulate upload delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const newRecord = {
            id: Date.now(),
            fileName: selectedFile.name,
            fileType: selectedFile.type,
            fileSize: selectedFile.size,
            description: description || 'No description',
            uploadDate: new Date().toISOString(),
        };

        setRecords([newRecord, ...records]);
        setSelectedFile(null);
        setDescription('');
        setUploading(false);
        setUploadSuccess(true);

        // Clear success message after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000);

        // Reset file input
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
    };

    const getFileIcon = (type) => {
        if (type === 'application/pdf') return File;
        if (type.startsWith('image/')) return Image;
        return FileText;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-800">Medical Records</h1>
                <p className="text-gray-600 mt-1">
                    Upload and manage your medical documents
                </p>
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload New Record</h2>

                {uploadSuccess && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="text-sm text-green-700">Record uploaded successfully!</p>
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <form onSubmit={handleUpload} className="space-y-4">
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
                                        : 'Click to upload PDF, JPG, or PNG'}
                                </span>
                            </label>
                        </div>
                        {selectedFile && (
                            <div className="mt-2 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <File className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-700">{selectedFile.name}</span>
                                    <span className="text-xs text-gray-500">
                                        ({formatFileSize(selectedFile.size)})
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedFile(null);
                                        const fileInput = document.getElementById('file-input');
                                        if (fileInput) fileInput.value = '';
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded"
                                >
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                            Description <span className="text-gray-400">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g., Blood test report, X-ray scan..."
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Upload Button */}
                    <button
                        type="submit"
                        disabled={uploading || !selectedFile}
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
                                Upload Record
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Records List */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Records</h2>

                {records.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">No medical records uploaded yet</p>
                        <p className="text-gray-400 text-sm mt-1">
                            Upload your medical documents to keep them organized
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {records.map((record) => {
                            const FileIcon = getFileIcon(record.fileType);
                            return (
                                <div
                                    key={record.id}
                                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                                            <FileIcon className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-gray-800 truncate">
                                                {record.fileName}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {record.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{formatDate(record.uploadDate)}</span>
                                        <span>•</span>
                                        <span>{formatFileSize(record.fileSize)}</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                            <Eye className="w-3.5 h-3.5" />
                                            View
                                        </button>
                                        <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                                            <Download className="w-3.5 h-3.5" />
                                            Download
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
