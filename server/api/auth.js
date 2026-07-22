import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../lib/db.js';
import { generateToken, authMiddleware } from '../lib/middleware.js';

const router = express.Router();

export default router;

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    await query(
      'INSERT INTO users (id, username, email, password) VALUES ($1, $2, $3, $4)',
      [id, username, email, hashedPassword]
    );

    const token = generateToken({ id, username });
    res.status(201).json({ token, user: { id, username, email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await query('UPDATE users SET status = $1 WHERE id = $2', ['online', user.id]);

    const token = generateToken({ id: user.id, username: user.username });
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar, status: 'online' }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await query('SELECT id, username, email, avatar, status, created_at FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Handles /api/auth/* and /api/register, /api/login
router.all('*', (req, res) => {
  const path = req.originalUrl;
  if (path === '/api/register' && req.method === 'POST') {
    return router.handle(req, res);
  }
  if (path === '/api/login' && req.method === 'POST') {
    return router.handle(req, res);
  }
  if (path === '/api/me' && req.method === 'GET') {
    return router.handle(req, res);
  }
  res.status(404).json({ error: 'Not found' });
});
