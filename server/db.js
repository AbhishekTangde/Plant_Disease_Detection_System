const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'agri.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("Error opening db:", err.message);
  else console.log("Connected to SQLite database.");
});

// Initialize Tables
db.serialize(() => {
  // Users
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT,
    joined TEXT,
    scans INTEGER,
    status TEXT
  )`);

  // Orders
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    userId TEXT,
    date TEXT,
    items TEXT,
    total REAL
  )`);

  // Scans
  db.run(`CREATE TABLE IF NOT EXISTS scans (
    id TEXT PRIMARY KEY,
    userId TEXT,
    crop TEXT,
    disease TEXT,
    acc INTEGER,
    icon TEXT,
    date TEXT
  )`);

  // Community Posts
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    userId TEXT,
    authorName TEXT,
    authorRole TEXT,
    title TEXT,
    content TEXT,
    date TEXT,
    replies INTEGER
  )`);
  
  // Community Replies
  db.run(`CREATE TABLE IF NOT EXISTS replies (
    id TEXT PRIMARY KEY,
    postId TEXT,
    userId TEXT,
    authorName TEXT,
    authorRole TEXT,
    content TEXT,
    date TEXT,
    FOREIGN KEY(postId) REFERENCES posts(id)
  )`);
});

module.exports = db;
