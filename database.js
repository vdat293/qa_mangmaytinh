const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'database.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Exam attempts table
        db.run(`CREATE TABLE IF NOT EXISTS exam_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            exam_id TEXT,
            score REAL,
            completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        // Create default admin if not exists
        const adminUser = 'admin';
        const adminPass = 'admin123'; // Default password, should be changed
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(adminPass, salt);

        db.get("SELECT * FROM users WHERE username = ?", [adminUser], (err, row) => {
            if (!row) {
                db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [adminUser, hash, 'admin'], (err) => {
                    if (err) console.error(err.message);
                    else console.log('Default admin account created.');
                });
            }
        });
    });
}

module.exports = db;
