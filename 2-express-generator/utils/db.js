const path = require('path');
const sqlite3 = require('sqlite3').verbose();

/* Opret forbindelse til database */
const db = new sqlite3.Database(
    path.join(__dirname, '../database/database.db'),
    (err) => {
        if (err) {
            console.error('Fejl i database:', err.message);
        } else {
            console.log('Database forbundet');
        }
    }
);

/* Opret tabel hvis den ikke findes */
db.serialize(() => {
    console.log('Opretter orders-tabel hvis den ikke findes...');

    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        navn TEXT,
        aktivitet TEXT,
        dato TEXT,
        tid TEXT,
        antal INTEGER,
        total_pris INTEGER,
        telefon TEXT,
        bemærkning TEXT,
        sms_paamindelse INTEGER,
        payment_confirmed INTEGER DEFAULT 0,
        reminder_sent INTEGER DEFAULT 0
      )
    `);
    
    
    db.run(`
        CREATE TABLE IF NOT EXISTS payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          cardholder_name TEXT NOT NULL,
          card_last4 TEXT NOT NULL,
          card_expiry TEXT NOT NULL,
          cvc_hash TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        )
      `);
    console.log('Database klar.');
});

db.serialize(() => {
    console.log('Opretter orders-tabel hvis den ikke findes...');
  
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        navn TEXT NOT NULL,
        aktivitet TEXT NOT NULL,
        dato TEXT NOT NULL,
        tid TEXT NOT NULL,
        antal INTEGER NOT NULL,
        total_pris INTEGER NOT NULL,
        telefon TEXT NOT NULL,
        bemærkning TEXT,
        sms_paamindelse INTEGER NOT NULL CHECK (sms_paamindelse IN (0,1)),
        reminder_sent INTEGER NOT NULL DEFAULT 0,      -- 👈 NY
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  
    console.log('Database klar.');
  });
  

module.exports = db;