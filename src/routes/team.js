const express = require('express');
const { authenticate, requirePlan } = require('../middleware/auth');
const { query } = require('../database');

const router = express.Router();

// ─── GET /api/team ────────────────────────────────────────────
router.get('/', authenticate, requirePlan('business', 'agency', 'enterprise'), async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT tm.*, u.email, u.full_name, u.avatar_url
       FROM team_members tm
       JOIN users u ON u.id = tm.member_id
       WHERE tm.owner_id = $1
       ORDER BY tm.invited_at DESC`,
      [req.user.id]
    );
    res.json({ team: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// ─── POST /api/team/invite ────────────────────────────────────
router.post('/invite', authenticate, requirePlan('business', 'agency', 'enterprise'), async (req, res) => {
  try {
    const { email, role } = req.body;
    
    const { rows: userRows } = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (!userRows[0]) return res.status(404).json({ error: 'User not found with that email' });
    
    const { rows } = await query(
      `INSERT INTO team_members (owner_id, member_id, role, status)
       VALUES ($1, $2, $3, 'pending') RETURNING *`,
      [req.user.id, userRows[0].id, role || 'editor']
    );
    
    res.status(201).json({ member: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to invite member' });
  }
});

// ─── DELETE /api/team/:id ─────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'DELETE FROM team_members WHERE id = $1 AND owner_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Member not found' });
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

module.exports = router;
