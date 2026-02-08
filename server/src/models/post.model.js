import mongoose from 'mongoose';

const doctorPostSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    content: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Index for sorting by newest first
doctorPostSchema.index({ createdAt: -1 });

const DoctorPost = mongoose.model('DoctorPost', doctorPostSchema);

export default DoctorPost;
