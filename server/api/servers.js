import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../lib/db.js';
import { authMiddleware } from '../lib/middleware.js';

const router = express.Router();
export default router;

// Create server
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Server name required' });

    const id = uuidv4();
    await query('INSERT INTO servers (id, name, owner_id) VALUES ($1, $2, $3)', [id, name, req.user.id]);
    await query('INSERT INTO server_members (user_id, server_id, role) VALUES ($1, $2, $3)', [req.user.id, id, 'owner']);

    // Create default channels
    const generalId = uuidv4();
    const voiceId = uuidv4();
    await query('INSERT INTO channels (id, server_id, name, type, position) VALUES ($1, $2, $3, $4, $5)', [generalId, id, 'general', 'text', 0]);
    await query('INSERT INTO channels (id, server_id, name, type, position) VALUES ($1, $2, $3, $4, $5)', [voiceId, id, 'Voice', 'voice', 1]);

    res.status(201).json({ id, name, owner_id: req.user.id, channels: [{ id: generalId, name: 'general', type: 'text' }, { id: voiceId, name: 'Voice', type: 'voice' }] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's servers
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `SELECT s.id, s.name, s.icon, s.owner_id, sm.role
       FROM servers s
       JOIN server_members sm ON s.id = sm.server_id
       WHERE sm.user_id = $1`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get server by ID with channels and members
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const server = await query('SELECT * FROM servers WHERE id = $1', [req.params.id]);
    if (server.rows.length === 0) return res.status(404).json({ error: 'Server not found' });

    const channels = await query('SELECT * FROM channels WHERE server_id = $1 ORDER BY position', [req.params.id]);
    const members = await query(
      `SELECT u.id, u.username, u.avatar, u.status, sm.role
       FROM users u
       JOIN server_members sm ON u.id = sm.user_id
       WHERE sm.server_id = $1`,
      [req.params.id]
    );

    res.json({ ...server.rows[0], channels: channels.rows, members: members.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Join server
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    await query(
      'INSERT INTO server_members (user_id, server_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [req.user.id, req.params.id, 'member']
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
