const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'chat.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room TEXT,
            username TEXT,
            text TEXT,
            time TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error("Error creating table: " + err.message);
            }
        });
    }
});

function saveMessage(room, username, text, time) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO messages (room, username, text, time) VALUES (?, ?, ?, ?)`;
        db.run(sql, [room, username, text, time], function (err) {
            if (err) {
                console.error(err.message);
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

function getRoomMessages(room) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM messages WHERE room = ? ORDER BY created_at ASC`;
        db.all(sql, [room], (err, rows) => {
            if (err) {
                console.error(err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = {
    saveMessage,
    getRoomMessages
};
