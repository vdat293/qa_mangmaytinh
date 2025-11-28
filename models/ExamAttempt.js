const mongoose = require('mongoose');

const examAttemptSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    examId: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
