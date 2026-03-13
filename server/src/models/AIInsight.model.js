import mongoose from 'mongoose';

const aiInsightSchema = new mongoose.Schema({
    report: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
        required: true,
        unique: true,
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    aiSummary: {
        type: String,
        default: '',
    },
    keyFindings: {
        type: [String],
        default: [],
    },
    possibleConditions: {
        type: [String],
        default: [],
    },
    suggestedNextSteps: {
        type: [String],
        default: [],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const AIInsight = mongoose.model('AIInsight', aiInsightSchema);
export default AIInsight;
