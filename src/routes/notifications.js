const express = require('express');
const { authenticate } = require('../middleware/auth');
const { query } = require('../database');

const router = express.Router();

// ─── GET /api/notifications ───────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const { unread_only, limit = 50 } = req.query;
    
    let sql = 'SELECT * FROM notifications WHERE user_id = $1';
    if (unread_only === 'true') sql += ' AND is_read = FALSE';
    sql += ' ORDER BY created_at DESC LIMIT $2';
    
    const { rows } = await query(sql, [req.user.id, limit]);
    res.json({ notifications: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ─── POST /api/notifications/:id/read ─────────────────────────
router.post('/:id/read', authenticate, async (req, res) => {
  try {
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// ─── POST /api/notifications/read-all ─────────────────────────
router.post('/read-all', authenticate, async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// ─── Helper: Create notification ──────────────────────────────
async function createNotification(userId, type, title, message, data = {}) {
  await query(
    'INSERT INTO notifications (user_id, type, title, message, data) VALUES ($1,$2,$3,$4,$5)',
    [userId, type, title, message, JSON.stringify(data)]
  );
}

module.exports = router;
module.exports.createNotification = createNotification;
