const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      activity TEXT NOT NULL,
      persons INTEGER NOT NULL,
      total_price REAL NOT NULL,

      event_date TEXT NOT NULL,
      event_time TEXT NOT NULL,
      event_datetime TEXT NOT NULL,

      wants_sms INTEGER DEFAULT 0,
      notes TEXT,

      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
});

module.exports = db;

