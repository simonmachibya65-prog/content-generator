const express = require('express');
const { authenticate } = require('../middleware/auth');
const { query } = require('../database');
const AIService = require('../services/aiService');
const PublishingService = require('../services/publishingService');
const logger = require('../utils/logger');

const router = express.Router();

// ─── GET /api/automation/autopilot ────────────────────────────
router.get('/autopilot', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM autopilot_settings WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ settings: rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch autopilot settings' });
  }
});

// ─── PUT /api/automation/autopilot ────────────────────────────
router.put('/autopilot', authenticate, async (req, res) => {
  try {
    const {
      posts_per_month, videos_per_month, max_posts_per_day,
      publishing_mode, platforms, social_account_ids,
      auto_approve, content_language, content_tone,
      pause_on_errors, pause_for_holidays
    } = req.body;

    const { rows } = await query(
      `INSERT INTO autopilot_settings (
        user_id, posts_per_month, videos_per_month, max_posts_per_day,
        publishing_mode, platforms, social_account_ids, auto_approve,
        content_language, content_tone, pause_on_errors, pause_for_holidays
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      ON CONFLICT (user_id) DO UPDATE SET
        posts_per_month=$2, videos_per_month=$3, max_posts_per_day=$4,
        publishing_mode=$5, platforms=$6, social_account_ids=$7, auto_approve=$8,
        content_language=$9, content_tone=$10, pause_on_errors=$11,
        pause_for_holidays=$12, updated_at=NOW()
      RETURNING *`,
      [
        req.user.id, posts_per_month || 20, videos_per_month || 10,
        max_posts_per_day || 2, publishing_mode || 'auto',
        platforms || [], social_account_ids || [], auto_approve !== false,
        content_language || 'en', content_tone || 'professional',
        pause_on_errors !== false, pause_for_holidays || false
      ]
    );
    res.json({ settings: rows[0] });
  } catch (err) {
    logger.error('Save autopilot settings error:', err);
    res.status(500).json({ error: 'Failed to save autopilot settings' });
  }
});

// ─── POST /api/automation/autopilot/toggle ────────────────────
router.post('/autopilot/toggle', authenticate, async (req, res) => {
  try {
    const { rows: existing } = await query(
      'SELECT is_enabled FROM autopilot_settings WHERE user_id = $1',
      [req.user.id]
    );

    const currentState = existing[0]?.is_enabled || false;
    const newState = !currentState;

    const { rows } = await query(
      `INSERT INTO autopilot_settings (user_id, is_enabled)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET is_enabled = $2, updated_at = NOW()
       RETURNING *`,
      [req.user.id, newState]
    );

    logger.info(`Autopilot ${newState ? 'activated' : 'paused'} for user ${req.user.id}`);
    res.json({ settings: rows[0], is_enabled: newState });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle autopilot' });
  }
});

// ─── POST /api/automation/autopilot/generate-now ──────────────
// Manually trigger content generation for autopilot
router.post('/autopilot/generate-now', authenticate, async (req, res) => {
  try {
    const { rows: settingsRows } = await query(
      'SELECT * FROM autopilot_settings WHERE user_id = $1 AND is_enabled = TRUE',
      [req.user.id]
    );

    if (!settingsRows[0]) {
      return res.status(400).json({ error: 'Autopilot not enabled. Enable it first.' });
    }

    const settings = settingsRows[0];

    // Get business profile
    const { rows: profileRows } = await query(
      'SELECT * FROM business_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (!profileRows[0]) {
      return res.status(400).json({ error: 'Complete your business profile first' });
    }

    const profile = profileRows[0];
    const accountIds = settings.social_account_ids || [];
    const count = req.body.count || 3;

    const generatedPosts = [];

    for (let i = 0; i < count; i++) {
      try {
        // Generate content for all accounts
        const topic = `${profile.products || profile.business_name} - ${profile.industry}`;
        const platforms = settings.platforms?.length > 0 ? settings.platforms : ['instagram', 'facebook'];

        const content = await AIService.generateTextContent({
          userId: req.user.id,
          topic,
          platforms,
          tone: settings.content_tone,
          language: settings.content_language,
          brandVoice: null
        });

        // Save post
        const { rows: postRows } = await query(
          `INSERT INTO posts (user_id, content_text, platform_data, status, ai_generated, tone, language)
           VALUES ($1, $2, $3, 'scheduled', true, $4, $5) RETURNING *`,
          [req.user.id, topic, JSON.stringify(content), settings.content_tone, settings.content_language]
        );

        // Schedule for each account
        if (accountIds.length > 0) {
          const scheduledAt = new Date(Date.now() + (i + 1) * 4 * 60 * 60 * 1000); // spread by 4 hours
          await PublishingService.schedulePost(postRows[0].id, accountIds, scheduledAt);
        }

        generatedPosts.push(postRows[0]);
      } catch (innerErr) {
        logger.error('Generate post error:', innerErr);
      }
    }

    res.json({ posts: generatedPosts, count: generatedPosts.length });
  } catch (err) {
    logger.error('Generate-now error:', err);
    res.status(500).json({ error: 'Content generation failed' });
  }
});

// ─── GET /api/automation/workflows ────────────────────────────
router.get('/workflows', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM workflows WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ workflows: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

// ─── POST /api/automation/workflows ───────────────────────────
router.post('/workflows', authenticate, async (req, res) => {
  try {
    const { name, description, trigger_type, trigger_config, conditions, actions } = req.body;

    if (!name || !trigger_type || !actions?.length) {
      return res.status(400).json({ error: 'Name, trigger type and actions required' });
    }

    const { rows } = await query(
      `INSERT INTO workflows (user_id, name, description, trigger_type, trigger_config, conditions, actions)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        req.user.id, name, description, trigger_type,
        JSON.stringify(trigger_config || {}),
        JSON.stringify(conditions || []),
        JSON.stringify(actions)
      ]
    );

    res.status(201).json({ workflow: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

// ─── DELETE /api/automation/workflows/:id ─────────────────────
router.delete('/workflows/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'DELETE FROM workflows WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Workflow not found' });
    res.json({ message: 'Workflow deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
});

// ─── POST /api/automation/workflows/:id/toggle ────────────────
router.post('/workflows/:id/toggle', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE workflows SET
        status = CASE WHEN status = 'active' THEN 'paused' ELSE 'active' END,
        updated_at = NOW()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Workflow not found' });
    res.json({ workflow: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle workflow' });
  }
});

module.exports = router;
