const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

db.serialize(() => {

  db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullname TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            account_type TEXT,
            balance REAL DEFAULT 0
        )
    `, (err) => {
    if (err) {
      console.error("Users table creation failed:", err.message);
    } else {
      console.log("Users table ready.");
    }
  });

  db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            transaction_type TEXT NOT NULL,
            amount REAL NOT NULL,
            description TEXT,
            timestamp TEXT DEFAULT (datetime('now', 'localtime')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `, (err) => {
    if (err) {
      console.error("Transactions table creation failed:", err.message);
    } else {
      console.log("Transactions table ready.");
    }
  });

  db.run(`
        CREATE TABLE IF NOT EXISTS security_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            login_time TEXT,
            logout_time TEXT,
            ip_address TEXT,
            session_status TEXT NOT NULL,
            session_duration INTEGER,
            description TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `, (err) => {
    if (err) {
      console.error("Security logs table creation failed:", err.message);
    } else {
      console.log("Security logs table ready.");
    }
  });

});

module.exports = db;