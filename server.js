require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const connectDB = require('./database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const ExamAttempt = require('./models/ExamAttempt');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 8000;
const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key_here';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Connect to Database
connectDB();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.'))); // Serve static files from current directory

// Explicitly serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: 'No token provided.' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(500).json({ message: 'Failed to authenticate token.' });
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

const verifyAdmin = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Require Admin Role!' });
    }
    next();
};

// --- AUTH ROUTES ---

// Register
app.post('/api/auth/register', async (req, res) => {
    const { username, password, fullname } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required.' });

    try {
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: 'Username already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            username,
            password: hashedPassword,
            fullname
        });

        res.status(201).json({ message: 'User registered successfully.', userId: user._id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found.' });

        const passwordIsValid = await bcrypt.compare(password, user.password);
        if (!passwordIsValid) return res.status(401).json({ message: 'Invalid password.' });

        const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY, { expiresIn: 86400 }); // 24 hours
        res.status(200).json({ auth: true, token: token, role: user.role, username: user.username, fullname: user.fullname });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- EXAM ROUTES ---

// Submit Exam Result
app.post('/api/exam/submit', verifyToken, async (req, res) => {
    const { exam_id, score, details } = req.body;

    try {
        await ExamAttempt.create({
            userId: req.userId,
            examId: exam_id,
            score: score,
            details: details
        });
        res.status(200).json({ message: 'Result saved.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- ADMIN ROUTES ---

// Get Stats
app.get('/api/admin/stats', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const stats = await ExamAttempt.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $match: {
                    'user.role': { $ne: 'admin' }
                }
            },
            {
                $group: {
                    _id: { username: '$user.username', fullname: '$user.fullname', examId: '$examId' },
                    attempt_count: { $sum: 1 },
                    average_score: { $avg: '$score' },
                    highest_score: { $max: '$score' },
                    last_attempt: { $max: '$completedAt' }
                }
            },
            {
                $project: {
                    _id: 0,
                    username: '$_id.username',
                    fullname: '$_id.fullname',
                    exam_id: '$_id.examId',
                    attempt_count: 1,
                    average_score: 1,
                    highest_score: 1,
                    last_attempt: 1
                }
            },
            {
                $sort: { last_attempt: -1 }
            }
        ]);

        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Question Stats
app.get('/api/admin/question-stats', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const stats = await ExamAttempt.aggregate([
            { $unwind: '$details' },
            {
                $group: {
                    _id: '$details.questionId',
                    total_attempts: { $sum: 1 },
                    correct_count: {
                        $sum: { $cond: [{ $eq: ['$details.isCorrect', true] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    question_id: '$_id',
                    total_attempts: 1,
                    correct_count: 1,
                    correct_percentage: {
                        $multiply: [{ $divide: ['$correct_count', '$total_attempts'] }, 100]
                    }
                }
            },
            { $sort: { question_id: 1 } }
        ]);

        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// AI Chat Route
app.post('/api/ai/chat', verifyToken, async (req, res) => {
    try {
        const { message, history, context } = req.body;

        // Construct the full prompt with context
        const fullPrompt = context ? `${context}\n\nUser Question: ${message}` : message;

        const chat = model.startChat({
            history: history || [],
        });

        const result = await chat.sendMessage(fullPrompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ text });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ message: "Failed to process AI request." });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
