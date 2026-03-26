// ============================================
// JOEL'S PORTFOLIO BACKEND
// Node.js + Express + PostgreSQL
// ============================================

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ───
app.use(express.json());
app.use(cors({
  origin: '*', // In production, replace * with your GitHub Pages URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// ─── DATABASE CONNECTION ───
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// ─── CREATE TABLE IF NOT EXISTS ───
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL,
        subject VARCHAR(200),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Database table ready');
  } catch (err) {
    console.error('❌ Database init error:', err.message);
  }
}

// ─── ROUTES ───

// Health check - visit this to see if server is running
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: "Joel's Portfolio Backend is running! 🚀",
    endpoints: {
      'POST /api/contact': 'Submit contact form',
      'GET /api/contacts': 'View all messages (admin)'
    }
  });
});

// POST /api/contact - Save contact form submission
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({
      error: 'Name, email, and message are required'
    });
  }

  // Simple email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO contacts (name, email, subject, message)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [name, email, subject || 'No subject', message]
    );

    console.log(`📨 New contact from ${name} (${email})`);

    res.status(201).json({
      success: true,
      message: 'Your message has been saved! Joel will get back to you soon.',
      id: result.rows[0].id
    });

  } catch (err) {
    console.error('❌ Database error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// GET /api/contacts - View all submissions (for Joel to check)
app.get('/api/contacts', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM contacts ORDER BY created_at DESC'
    );
    res.json({ count: result.rows.length, contacts: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── START SERVER ───
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Visit: http://localhost:${PORT}`);
  });
});
