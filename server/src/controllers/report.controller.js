import Report from '../models/report.model.js';
import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';// POST /api/v1/reports
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "mediconnect/reports",
                resource_type: "auto",
                type: "upload"
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );

        streamifier.createReadStream(buffer).pipe(stream);
    });
};

export const uploadReport = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "File required"
            });
        }

        const { title } = req.body;
        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Title is required',
            });
        }

        const result = await uploadToCloudinary(req.file.buffer);

        const report = await Report.create({
            patient: req.user.id,
            title: req.body.title || title,
            fileUrl: result.secure_url,
            publicId: result.public_id,
            fileType: req.file.mimetype,
            uploadedAt: new Date()
        });

        res.json({
            success: true,
            report
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Upload failed",
            error: error.message
        });
    }
};

// GET /api/v1/reports/my-reports
export const getMyReports = async (req, res) => {
    try {
        const reports = await Report.find({ patient: req.user.id }).sort({ uploadedAt: -1 });

        res.status(200).json({
            success: true,
            reports,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your reports',
            error: error.message,
        });
    }
};

// GET /api/v1/reports/patient/:patientId
export const getPatientReports = async (req, res) => {
    try {
        const { patientId } = req.params;

        const reports = await Report.find({ patient: patientId }).sort({ uploadedAt: -1 });

        res.status(200).json({
            success: true,
            reports,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch patient reports',
            error: error.message,
        });
    }
};

// DELETE /api/v1/reports/:id
export const deleteReport = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the report and ensure it belongs to the logged-in patient
        const report = await Report.findOne({ _id: id, patient: req.user.id });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found or you do not have permission',
            });
        }

        // Delete from Cloudinary
        try {
            // Because we pass resource_type: 'raw' on upload, we must destroy it as raw
            await cloudinary.uploader.destroy(report.publicId, { resource_type: 'raw' });
        } catch (cloudErr) {
            console.log("Cloudinary destroy error: ", cloudErr);
            // Proceed to delete DB record anyway to avoid orphaned DB records if Cloudinary fails
        }

        // Delete from MongoDB
        await Report.deleteOne({ _id: id });

        res.status(200).json({
            success: true,
            message: 'Report deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete report',
            error: error.message,
        });
    }
};
