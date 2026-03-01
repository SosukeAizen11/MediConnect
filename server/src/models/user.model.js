import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['PATIENT', 'DOCTOR', 'ADMIN'],
        default: 'PATIENT',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    // Profile fields
    phone: {
        type: String,
        trim: true,
    },
    gender: {
        type: String,
        enum: ['MALE', 'FEMALE', 'OTHER', ''],
        default: '',
    },
    dateOfBirth: {
        type: Date,
    },
    address: {
        type: String,
        trim: true,
    },
    emergencyContact: {
        type: String,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
