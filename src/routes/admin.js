const express = require('express');
const { authenticate } = require('../middleware/auth');
const { query } = require('../database');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');

const router = express.Router();

// ─── Admin Auth Middleware ────────────────────────────────────
async function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { rows } = await query(
    'SELECT plan FROM users WHERE id = $1',
    [req.user.id]
  );

  // Check if user has admin plan or is in admin whitelist
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
  const { rows: userRows } = await query('SELECT email FROM users WHERE id = $1', [req.user.id]);

  if (!adminEmails.includes(userRows[0]?.email)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// ─── GET /api/admin/overview ──────────────────────────────────
router.get('/overview', authenticate, requireAdmin, async (req, res) => {
  try {
    const statsPromises = [
      query('SELECT COUNT(*) AS total FROM users WHERE is_active = TRUE'),
      query(`SELECT COUNT(*) AS active FROM users WHERE last_login_at > NOW() - INTERVAL '30 days'`),
      query(`SELECT COUNT(*) AS free FROM users WHERE plan = 'free'`),
      query(`SELECT COUNT(*) AS starter FROM users WHERE plan = 'starter'`),
      query(`SELECT COUNT(*) AS pro FROM users WHERE plan = 'creator_pro'`),
      query(`SELECT COUNT(*) AS business FROM users WHERE plan = 'business'`),
      query(`SELECT COUNT(*) AS agency FROM users WHERE plan = 'agency'`),
      query(`SELECT COUNT(*) AS published FROM publishing_jobs WHERE status = 'published' AND published_at > NOW() - INTERVAL '30 days'`),
      query(`SELECT COALESCE(SUM(ai_credits_used), 0) AS ai_today FROM users WHERE updated_at::date = CURRENT_DATE`)
    ];

    const results = await Promise.all(statsPromises);

    res.json({
      stats: {
        total_users: parseInt(results[0].rows[0].total),
        active_users: parseInt(results[1].rows[0].active),
        free_users: parseInt(results[2].rows[0].free),
        starter_users: parseInt(results[3].rows[0].starter),
        pro_users: parseInt(results[4].rows[0].pro),
        business_users: parseInt(results[5].rows[0].business),
        agency_users: parseInt(results[6].rows[0].agency),
        posts_published: parseInt(results[7].rows[0].published),
        ai_requests_today: parseInt(results[8].rows[0].ai_today),
        mrr: 0 // Calculate from subscriptions
      }
    });
  } catch (err) {
    logger.error('Admin overview error:', err);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

// ─── GET /api/admin/users ─────────────────────────────────────
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const { search, plan, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT id, email, full_name, avatar_url, plan, ai_credits, ai_credits_used,
                      is_active, email_verified, last_login_at, created_at,
                      COUNT(*) OVER() AS total_count
               FROM users WHERE 1=1`;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (full_name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }
    if (plan) { params.push(plan); sql += ` AND plan = $${params.length}`; }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await query(sql, params);
    res.json({
      users: rows,
      pagination: { page: +page, limit: +limit, total: +(rows[0]?.total_count || 0) }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ─── POST /api/admin/users/:id/suspend ───────────────────────
router.post('/users/:id/suspend', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await query(
      'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, is_active',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    logger.info(`Admin ${req.user.id} toggled user ${req.params.id} status`);
    res.json({ message: rows[0].is_active ? 'User reactivated' : 'User suspended', ...rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to suspend user' });
  }
});

// ─── POST /api/admin/users/:id/impersonate ────────────────────
router.post('/users/:id/impersonate', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await query('SELECT id, email FROM users WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });

    const impersonateToken = jwt.sign(
      { userId: rows[0].id, impersonatedBy: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    logger.info(`Admin ${req.user.id} impersonating user ${req.params.id}`);
    res.json({ impersonateToken, user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to impersonate user' });
  }
});

// ─── PUT /api/admin/users/:id/plan ───────────────────────────
router.put('/users/:id/plan', authenticate, requireAdmin, async (req, res) => {
  try {
    const { plan, ai_credits } = req.body;
    const { rows } = await query(
      'UPDATE users SET plan = $1, ai_credits = COALESCE($2, ai_credits) WHERE id = $3 RETURNING id, plan, ai_credits',
      [plan, ai_credits, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user plan' });
  }
});

// ─── GET /api/admin/analytics ────────────────────────────────
router.get('/analytics', authenticate, requireAdmin, async (req, res) => {
  try {
    const [publishingStats, userGrowth, aiUsage] = await Promise.all([
      query(`
        SELECT platform_name, COUNT(*) AS total,
               COUNT(*) FILTER (WHERE status = 'published') AS published,
               COUNT(*) FILTER (WHERE status = 'failed') AS failed
        FROM publishing_jobs
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY platform_name ORDER BY total DESC
      `),
      query(`
        SELECT DATE_TRUNC('day', created_at)::date AS day, COUNT(*) AS new_users
        FROM users WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY day ORDER BY day
      `),
      query(`
        SELECT DATE_TRUNC('day', updated_at)::date AS day,
               SUM(ai_credits_used) AS credits_used
        FROM users WHERE updated_at > NOW() - INTERVAL '30 days'
        GROUP BY day ORDER BY day
      `)
    ]);

    res.json({
      publishing_by_platform: publishingStats.rows,
      user_growth: userGrowth.rows,
      ai_usage: aiUsage.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ─── GET /api/admin/system ────────────────────────────────────
router.get('/system', authenticate, requireAdmin, async (req, res) => {
  try {
    res.json({
      system: {
        node_version: process.version,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        env: process.env.NODE_ENV,
        db_connected: true
      },
      feature_flags: {
        ai_image_generation: !!process.env.OPENAI_API_KEY,
        google_auth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        payments: !!process.env.STRIPE_SECRET_KEY
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch system info' });
  }
});

module.exports = router;
