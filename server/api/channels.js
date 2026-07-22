import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../lib/db.js';
import { authMiddleware } from '../lib/middleware.js';

const router = express.Router();
export default router;

// Create channel
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { server_id, name, type } = req.body;
    if (!server_id || !name) return res.status(400).json({ error: 'Server ID and name required' });

    const pos = await query('SELECT COALESCE(MAX(position), -1) + 1 as pos FROM channels WHERE server_id = $1', [server_id]);
    const id = uuidv4();
    await query(
      'INSERT INTO channels (id, server_id, name, type, position) VALUES ($1, $2, $3, $4, $5)',
      [id, server_id, name, type || 'text', pos.rows[0].pos]
    );

    res.status(201).json({ id, server_id, name, type: type || 'text' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages for a channel
router.get('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before;

    let result;
    if (before) {
      result = await query(
        `SELECT m.*, u.username, u.avatar
         FROM messages m
         JOIN users u ON m.user_id = u.id
         WHERE m.channel_id = $1 AND m.id < $2
         ORDER BY m.created_at DESC LIMIT $3`,
        [req.params.id, before, limit]
      );
    } else {
      result = await query(
        `SELECT m.*, u.username, u.avatar
         FROM messages m
         JOIN users u ON m.user_id = u.id
         WHERE m.channel_id = $1
         ORDER BY m.created_at DESC LIMIT $2`,
        [req.params.id, limit]
      );
    }

    res.json(result.rows.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send message
router.post('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });

    const id = uuidv4();
    await query(
      'INSERT INTO messages (id, channel_id, user_id, content) VALUES ($1, $2, $3, $4)',
      [id, req.params.id, req.user.id, content]
    );

    const result = await query(
      `SELECT m.*, u.username, u.avatar
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = $1`,
      [id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
