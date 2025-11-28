const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'your_secret_key_here'; // In production, use environment variable

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.'))); // Serve static files from current directory

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
app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required.' });

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hash], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ message: 'Username already exists.' });
            }
            return res.status(500).json({ message: err.message });
        }
        res.status(201).json({ message: 'User registered successfully.', userId: this.lastID });
    });
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!user) return res.status(404).json({ message: 'User not found.' });

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) return res.status(401).json({ message: 'Invalid password.' });

        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: 86400 }); // 24 hours
        res.status(200).json({ auth: true, token: token, role: user.role, username: user.username });
    });
});

// --- EXAM ROUTES ---

// Submit Exam Result
app.post('/api/exam/submit', verifyToken, (req, res) => {
    const { exam_id, score } = req.body;

    db.run("INSERT INTO exam_attempts (user_id, exam_id, score) VALUES (?, ?, ?)", [req.userId, exam_id, score], function (err) {
        if (err) return res.status(500).json({ message: err.message });
        res.status(200).json({ message: 'Result saved.' });
    });
});

// --- ADMIN ROUTES ---

// Get Stats
// Get Stats
app.get('/api/admin/stats', verifyToken, verifyAdmin, (req, res) => {
    const sql = `
        SELECT 
            u.username, 
            ea.exam_id, 
            COUNT(ea.id) as attempt_count,
            AVG(ea.score) as average_score,
            MAX(ea.score) as highest_score,
            MAX(ea.completed_at) as last_attempt
        FROM users u 
        JOIN exam_attempts ea ON u.id = ea.user_id 
        WHERE u.role != 'admin'
        GROUP BY u.username, ea.exam_id
        ORDER BY last_attempt DESC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(200).json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
