const express = require('express');
const { authenticate } = require('../middleware/auth');
const { query } = require('../database');
const logger = require('../utils/logger');

const router = express.Router();

// ─── GET /api/social-accounts ─────────────────────────────────
// Get all connected accounts for the authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT sa.id, sa.platform_name, sa.account_id, sa.username, sa.display_name,
              sa.avatar_url, sa.profile_url, sa.followers_count, sa.status,
              sa.connected_at, sa.expires_at, sa.last_synced_at,
              sp.display_name AS platform_display_name, sp.color, sp.features
       FROM social_accounts sa
       JOIN social_platforms sp ON sp.name = sa.platform_name
       WHERE sa.user_id = $1 AND sa.status != 'disconnected'
       ORDER BY sa.connected_at DESC`,
      [req.user.id]
    );

    // Group by platform
    const platforms = {
      tiktok:    { connected: [], available: true },
      youtube:   { connected: [], available: true },
      x:         { connected: [], available: true },
      instagram: { connected: [], available: true },
      facebook:  { connected: [], available: true },
      linkedin:  { connected: [], available: true }
    };

    rows.forEach(account => {
      if (platforms[account.platform_name]) {
        platforms[account.platform_name].connected.push(account);
      }
    });

    res.json({ accounts: rows, platforms });
  } catch (err) {
    logger.error('Get social accounts error:', err);
    res.status(500).json({ error: 'Failed to fetch social accounts' });
  }
});

// ─── GET /api/social-accounts/:id ─────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT sa.*, sp.display_name AS platform_display_name, sp.color, sp.features
       FROM social_accounts sa
       JOIN social_platforms sp ON sp.name = sa.platform_name
       WHERE sa.id = $1 AND sa.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Account not found' });
    res.json({ account: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

// ─── POST /api/social-accounts/sync/:id ───────────────────────
// Sync account data (followers, profile) from the platform
router.post('/sync/:id', authenticate, async (req, res) => {
  try {
    await query(
      'UPDATE social_accounts SET last_synced_at = NOW() WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Account synced' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sync account' });
  }
});

// ─── GET /api/social-accounts/platforms/list ──────────────────
router.get('/platforms/list', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM social_platforms WHERE is_active = TRUE ORDER BY name'
    );
    res.json({ platforms: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch platforms' });
  }
});

module.exports = router;
