import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const db = new Database("enginex.db");
const upload = multer({ dest: 'uploads/' });

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    fname TEXT,
    lname TEXT,
    branch TEXT,
    year TEXT,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    xp INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 1,
    last_active_day TEXT
  );

  CREATE TABLE IF NOT EXISTS activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT,
    subject TEXT,
    score INTEGER,
    xp INTEGER DEFAULT 0,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Migration: Add xp column if it doesn't exist
try {
  db.prepare("ALTER TABLE activity ADD COLUMN xp INTEGER DEFAULT 0").run();
} catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS subject_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    subject_id TEXT,
    score INTEGER,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    user_id INTEGER PRIMARY KEY,
    gemini_api_key TEXT,
    notifications_enabled INTEGER DEFAULT 1,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS user_topics (
    user_id INTEGER,
    subject_id TEXT,
    topic TEXT,
    completed INTEGER DEFAULT 1,
    PRIMARY KEY (user_id, subject_id, topic),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Auth: Signup
  app.post("/api/auth/signup", (req, res) => {
    const { email, password, fname, lname, branch, year } = req.body;
    console.log(`Signup attempt: ${email}`);
    try {
      const stmt = db.prepare("INSERT INTO users (email, password, fname, lname, branch, year, last_active_day) VALUES (?, ?, ?, ?, ?, ?, ?)");
      const result = stmt.run(email, password, fname, lname, branch, year, new Date().toDateString());
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
      console.log(`Signup success: ${email}, ID: ${result.lastInsertRowid}`);
      res.json({ success: true, user });
    } catch (err: any) {
      console.error(`Signup error for ${email}:`, err.message);
      res.status(400).json({ error: "Email already exists or invalid data" });
    }
  });

  // Auth: Login
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt: ${email}`);
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password) as any;
    
    if (user) {
      console.log(`Login success: ${email}`);
      // Update streak logic
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      let newStreak = user.streak;

      if (user.last_active_day === yesterday) {
        newStreak += 1;
      } else if (user.last_active_day !== today) {
        newStreak = 1;
      }

      db.prepare("UPDATE users SET last_active_day = ?, streak = ? WHERE id = ?").run(today, newStreak, user.id);
      user.streak = newStreak;
      
      res.json({ success: true, user });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Get User Data
  app.get("/api/user/:id", (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id) as any;
    if (!user) return res.status(404).json({ error: "User not found" });

    const activity = db.prepare("SELECT * FROM activity WHERE user_id = ? ORDER BY date DESC LIMIT 20").all(user.id);
    const scores = db.prepare("SELECT * FROM subject_scores WHERE user_id = ?").all(user.id);
    const settings = db.prepare("SELECT * FROM settings WHERE user_id = ?").get(user.id);

    res.json({ user, activity, scores, settings });
  });

  // Log Activity (Test/Chat)
  app.post("/api/activity", (req, res) => {
    const { userId, type, subject, score, xp, xpGain, subjectId } = req.body;
    const gain = Number(xp || xpGain || 0);
    try {
      db.transaction(() => {
        db.prepare("INSERT INTO activity (user_id, type, subject, score, xp) VALUES (?, ?, ?, ?, ?)").run(userId, type, subject, score, gain);
        db.prepare("UPDATE users SET xp = xp + ? WHERE id = ?").run(gain, userId);
        if (type === 'Test') {
          db.prepare("INSERT INTO subject_scores (user_id, subject_id, score) VALUES (?, ?, ?)").run(userId, subjectId || subject, score);
        }
      })();
      res.json({ success: true });
    } catch (err: any) {
      console.error("Activity logging error:", err.message);
      res.status(500).json({ error: "Failed to log activity" });
    }
  });

  // Update Settings
  app.post("/api/settings", (req, res) => {
    const { userId, geminiApiKey } = req.body;
    db.prepare("INSERT OR REPLACE INTO settings (user_id, gemini_api_key) VALUES (?, ?)").run(userId, geminiApiKey);
    res.json({ success: true });
  });

  // Get Leaderboard
  app.get("/api/leaderboard", (req, res) => {
    const users = db.prepare("SELECT id, fname, lname, branch, xp FROM users ORDER BY xp DESC LIMIT 50").all();
    res.json({ users });
  });

  // Get User Topics
  app.get("/api/user/:id/topics", (req, res) => {
    const topics = db.prepare("SELECT * FROM user_topics WHERE user_id = ?").all(req.params.id);
    res.json({ topics });
  });

  // Toggle Topic
  app.post("/api/user/topics", (req, res) => {
    const { userId, subjectId, topic, completed } = req.body;
    if (completed) {
      db.prepare("INSERT OR REPLACE INTO user_topics (user_id, subject_id, topic, completed) VALUES (?, ?, ?, 1)").run(userId, subjectId, topic);
    } else {
      db.prepare("DELETE FROM user_topics WHERE user_id = ? AND subject_id = ? AND topic = ?").run(userId, subjectId, topic);
    }
    res.json({ success: true });
  });

  // Parse PDF/PPT (Simulated for PPT)
  app.post("/api/parse-doc", upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
      const filePath = req.file.path;
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      let text = "";

      if (fileExt === '.pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        text = data.text;
      } else {
        // For PPT/DOCX, we'll just read as text for now or return a placeholder
        // In a real app, you'd use specific libraries for these formats
        text = fs.readFileSync(filePath, 'utf8');
      }

      // Cleanup
      fs.unlinkSync(filePath);

      res.json({ text: text.substring(0, 10000) }); // Limit text size
    } catch (err: any) {
      console.error("File parsing error:", err.message);
      res.status(500).json({ error: "Failed to parse file" });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
