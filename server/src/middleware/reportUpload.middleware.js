import multer from 'multer';

// Use memory storage so we can buffer the file and upload stream to Cloudinary directly for more control (e.g. PDFs needing raw/auto resource_type vs images)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG are allowed.'), false);
    }
};

const reportUpload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter,
});

export default reportUpload;
