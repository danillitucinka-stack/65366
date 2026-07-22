import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../lib/db.js';
import { generateToken, verifyToken } from '../lib/middleware.js';

// --- Shared handlers ---

async function handleRegister(req, res) {
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
}

async function handleLogin(req, res) {
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
}

async function handleMe(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyToken(authHeader.split(' ')[1]);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const result = await query('SELECT id, username, email, avatar, status, created_at FROM users WHERE id = $1', [decoded.id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(result.rows[0]);
}

// --- Express router for local dev ---

const router = express.Router();
router.post('/register', handleRegister);
router.post('/login', handleLogin);
router.get('/me', handleMe);

export default router;

// --- Vercel serverless handler ---

export async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const path = req.url.split('?')[0];
    if (path === '/api/register' && req.method === 'POST') {
      const body = await parseBody(req);
      req.body = body;
      await handleRegister(req, res);
    } else if (path === '/api/login' && req.method === 'POST') {
      const body = await parseBody(req);
      req.body = body;
      await handleLogin(req, res);
    } else if (path === '/api/me' && req.method === 'GET') {
      await handleMe(req, res);
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Server error' }));
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}
