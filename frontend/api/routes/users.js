const express = require('express');
const { authenticate } = require('../middleware/auth');
const { query } = require('../database');
const bcrypt = require('bcryptjs');

const router = express.Router();

// ─── GET /api/users/profile ───────────────────────────────────
router.get('/profile', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, email, full_name, avatar_url, timezone, language, plan,
              ai_credits, ai_credits_used, email_verified, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ─── PUT /api/users/profile ───────────────────────────────────
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { full_name, avatar_url, timezone, language } = req.body;
    const { rows } = await query(
      `UPDATE users SET full_name=$1, avatar_url=$2, timezone=$3, language=$4, updated_at=NOW()
       WHERE id=$5 RETURNING id, email, full_name, avatar_url, timezone, language`,
      [full_name, avatar_url, timezone, language, req.user.id]
    );
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ─── PUT /api/users/password ──────────────────────────────────
router.put('/password', authenticate, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    
    const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(current_password, rows[0].password_hash);
    
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' });
    
    const newHash = await bcrypt.hash(new_password, 12);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);
    
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// ─── GET /api/users/stats ─────────────────────────────────────
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [accounts, posts, published, campaigns] = await Promise.all([
      query('SELECT COUNT(*) FROM social_accounts WHERE user_id = $1 AND status = $2', [req.user.id, 'connected']),
      query('SELECT COUNT(*) FROM posts WHERE user_id = $1', [req.user.id]),
      query('SELECT COUNT(*) FROM publishing_jobs WHERE user_id = $1 AND status = $2', [req.user.id, 'published']),
      query('SELECT COUNT(*) FROM campaigns WHERE user_id = $1 AND status = $2', [req.user.id, 'active'])
    ]);
    
    res.json({
      stats: {
        connected_accounts: +accounts.rows[0].count,
        total_posts: +posts.rows[0].count,
        published_posts: +published.rows[0].count,
        active_campaigns: +campaigns.rows[0].count,
        ai_credits_remaining: req.user.ai_credits - req.user.ai_credits_used
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
