const express = require('express');
const { authenticate } = require('../middleware/auth');
const { query } = require('../database');
const PublishingService = require('../services/publishingService');
const logger = require('../utils/logger');

const router = express.Router();

// ─── POST /api/publishing/publish ─────────────────────────────
// Publish a post now or schedule it
router.post('/publish', authenticate, async (req, res) => {
  try {
    const { post_id, social_account_ids, scheduled_at, publish_now } = req.body;

    if (!post_id || !social_account_ids?.length) {
      return res.status(400).json({ error: 'post_id and social_account_ids required' });
    }

    // Verify the post belongs to the user
    const { rows: postRows } = await query(
      'SELECT id FROM posts WHERE id = $1 AND user_id = $2',
      [post_id, req.user.id]
    );
    if (!postRows[0]) return res.status(404).json({ error: 'Post not found' });

    const jobs = await PublishingService.schedulePost(
      post_id,
      social_account_ids,
      scheduled_at || null
    );

    // Update post status
    await query(
      'UPDATE posts SET status = $1, scheduled_at = $2 WHERE id = $3',
      [scheduled_at ? 'scheduled' : 'processing', scheduled_at, post_id]
    );

    // If publish now, execute immediately
    if (publish_now || !scheduled_at) {
      for (const job of jobs) {
        PublishingService.executeJob(job.id).catch(err =>
          logger.error(`Async job ${job.id} error:`, err)
        );
      }
    }

    res.json({
      message: scheduled_at ? 'Post scheduled successfully' : 'Post queued for publishing',
      jobs
    });
  } catch (err) {
    logger.error('Publish error:', err);
    res.status(500).json({ error: 'Publishing failed' });
  }
});

// ─── GET /api/publishing/queue ────────────────────────────────
router.get('/queue', authenticate, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { rows } = await query(
      `SELECT pj.*, p.title, p.content_text,
              sa.username, sa.display_name, sa.avatar_url,
              COUNT(*) OVER() AS total_count
       FROM publishing_jobs pj
       JOIN posts p ON p.id = pj.post_id
       JOIN social_accounts sa ON sa.id = pj.social_account_id
       WHERE pj.user_id = $1 AND pj.status = $2
       ORDER BY pj.scheduled_at ASC NULLS FIRST, pj.created_at DESC
       LIMIT $3 OFFSET $4`,
      [req.user.id, status, limit, offset]
    );

    res.json({
      jobs: rows,
      pagination: { page: +page, limit: +limit, total: +(rows[0]?.total_count || 0) }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

// ─── GET /api/publishing/jobs/:id/logs ────────────────────────
router.get('/jobs/:id/logs', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT pl.* FROM publishing_logs pl
       JOIN publishing_jobs pj ON pj.id = pl.publishing_job_id
       WHERE pl.publishing_job_id = $1 AND pj.user_id = $2
       ORDER BY pl.created_at ASC`,
      [req.params.id, req.user.id]
    );
    res.json({ logs: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// ─── DELETE /api/publishing/jobs/:id ──────────────────────────
router.delete('/jobs/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE publishing_jobs SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status IN ('pending', 'processing')
       RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Job not found or cannot be cancelled' });
    res.json({ message: 'Job cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel job' });
  }
});

// ─── GET /api/publishing/calendar ─────────────────────────────
router.get('/calendar', authenticate, async (req, res) => {
  try {
    const { start, end } = req.query;

    const { rows } = await query(
      `SELECT pj.id, pj.platform_name, pj.status, pj.scheduled_at,
              p.title, p.content_text,
              sa.username, sa.avatar_url
       FROM publishing_jobs pj
       JOIN posts p ON p.id = pj.post_id
       JOIN social_accounts sa ON sa.id = pj.social_account_id
       WHERE pj.user_id = $1
         AND pj.scheduled_at BETWEEN $2 AND $3
       ORDER BY pj.scheduled_at ASC`,
      [req.user.id, start || new Date(), end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]
    );

    res.json({ events: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch calendar' });
  }
});

// ─── GET /api/publishing/stats ───────────────────────────────
router.get('/stats', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'pending')    AS scheduled,
         COUNT(*) FILTER (WHERE status = 'published')  AS published,
         COUNT(*) FILTER (WHERE status = 'failed')     AS failed,
         COUNT(*) FILTER (WHERE status = 'processing') AS processing
       FROM publishing_jobs WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({ stats: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ─── POST /api/publishing/bulk-schedule ───────────────────────
router.post('/bulk-schedule', authenticate, async (req, res) => {
  try {
    const { posts } = req.body; // [{post_id, social_account_ids, scheduled_at}]
    if (!posts?.length) return res.status(400).json({ error: 'Posts array required' });

    const allJobs = [];
    for (const item of posts) {
      const jobs = await PublishingService.schedulePost(
        item.post_id, item.social_account_ids, item.scheduled_at
      );
      allJobs.push(...jobs);
    }

    res.json({ jobs: allJobs, count: allJobs.length });
  } catch (err) {
    logger.error('Bulk schedule error:', err);
    res.status(500).json({ error: 'Bulk scheduling failed' });
  }
});

// ─── GET /api/publishing/publishing-modes ─────────────────────
router.get('/publishing-modes', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM publishing_modes WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ modes: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch publishing modes' });
  }
});

// ─── PUT /api/publishing/publishing-modes ─────────────────────
router.put('/publishing-modes', authenticate, async (req, res) => {
  try {
    const { modes } = req.body; // [{social_account_id, mode: 'auto'|'approval'|'manual'}]
    const updated = [];
    for (const m of (modes || [])) {
      const { rows } = await query(
        `INSERT INTO publishing_modes (user_id, social_account_id, mode)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, social_account_id)
         DO UPDATE SET mode = $3, updated_at = NOW()
         RETURNING *`,
        [req.user.id, m.social_account_id, m.mode]
      );
      updated.push(rows[0]);
    }
    res.json({ modes: updated });
  } catch (err) {
    logger.error('Update publishing modes error:', err);
    res.status(500).json({ error: 'Failed to update publishing modes' });
  }
});

// ─── POST /api/publishing/jobs/:id/approve ────────────────────
router.post('/jobs/:id/approve', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE publishing_jobs SET status = 'pending', approved_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status = 'awaiting_approval'
       RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Job not found or not awaiting approval' });

    // Execute immediately
    PublishingService.executeJob(rows[0].id).catch(err =>
      logger.error(`Approved job ${rows[0].id} error:`, err)
    );

    res.json({ message: 'Job approved and queued for publishing', job: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve job' });
  }
});

// ─── POST /api/publishing/jobs/:id/reject ─────────────────────
router.post('/jobs/:id/reject', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;
    const { rows } = await query(
      `UPDATE publishing_jobs SET status = 'cancelled', error_message = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [reason || 'Rejected by user', req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Job not found' });
    res.json({ message: 'Job rejected', job: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject job' });
  }
});

// ─── PUT /api/publishing/jobs/:id/reschedule ─────────────────
// Used by calendar drag-and-drop to move a post to a new date/time
router.put('/jobs/:id/reschedule', authenticate, async (req, res) => {
  try {
    const { scheduled_at } = req.body;
    if (!scheduled_at) return res.status(400).json({ error: 'scheduled_at required' });

    const { rows } = await query(
      `UPDATE publishing_jobs
       SET scheduled_at = $1, status = 'pending', next_retry_at = NULL, updated_at = NOW()
       WHERE id = $2 AND user_id = $3 AND status IN ('pending','failed','cancelled')
       RETURNING *`,
      [scheduled_at, req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Job not found or cannot be rescheduled' });
    res.json({ job: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reschedule job' });
  }
});

// ─── POST /api/publishing/jobs/:id/retry ─────────────────────
router.post('/jobs/:id/retry', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE publishing_jobs
       SET status = 'pending', retry_count = 0, next_retry_at = NULL,
           error_message = NULL, updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status = 'failed'
       RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Job not found or not in failed state' });

    PublishingService.executeJob(rows[0].id).catch(err =>
      logger.error(`Retry job ${rows[0].id} error:`, err)
    );

    res.json({ message: 'Job queued for retry', job: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retry job' });
  }
});

// ─── GET /api/publishing/account-health ──────────────────────
// Returns token expiry status for all connected accounts
router.get('/account-health', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT sa.id, sa.platform_name, sa.username, sa.display_name,
              sa.avatar_url, sa.status,
              ot.expires_at,
              CASE
                WHEN ot.expires_at IS NULL            THEN 'ok'
                WHEN ot.expires_at < NOW()            THEN 'expired'
                WHEN ot.expires_at < NOW() + INTERVAL '7 days' THEN 'expiring_soon'
                ELSE 'ok'
              END AS token_health
       FROM social_accounts sa
       LEFT JOIN oauth_tokens ot ON ot.social_account_id = sa.id
       WHERE sa.user_id = $1 AND sa.status != 'disconnected'
       ORDER BY sa.platform_name`,
      [req.user.id]
    );
    res.json({ accounts: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch account health' });
  }
});

module.exports = router;
