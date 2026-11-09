const express = require('express');
const { authenticate, requirePlan } = require('../middleware/auth');
const { query, transaction } = require('../database');
const AIService = require('../services/aiService');
const PublishingService = require('../services/publishingService');
const logger = require('../utils/logger');

const router = express.Router();

// ─── GET /api/campaigns ───────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT c.*, COUNT(*) OVER() AS total_count
               FROM campaigns c WHERE c.user_id = $1`;
    const params = [req.user.id];

    if (status) { params.push(status); sql += ` AND c.status = $${params.length}`; }

    sql += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await query(sql, params);
    res.json({
      campaigns: rows,
      pagination: { page: +page, limit: +limit, total: +(rows[0]?.total_count || 0) }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// ─── POST /api/campaigns ──────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      name, description, niche, brand_voice, target_audience, platforms,
      social_account_ids, content_types, posting_frequency, language,
      tone, auto_publish, start_date, end_date
    } = req.body;

    if (!name || !platforms?.length || !social_account_ids?.length) {
      return res.status(400).json({ error: 'Name, platforms, and social accounts required' });
    }

    const { rows } = await query(
      `INSERT INTO campaigns
         (user_id, name, description, niche, brand_voice, target_audience,
          platforms, social_account_ids, content_types, posting_frequency,
          language, tone, auto_publish, start_date, end_date, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'active')
       RETURNING *`,
      [
        req.user.id, name, description, niche, brand_voice, target_audience,
        platforms, social_account_ids, content_types || [],
        JSON.stringify(posting_frequency || {}),
        language || 'en', tone || 'professional', auto_publish || false,
        start_date, end_date
      ]
    );

    logger.info(`Campaign created: ${rows[0].id} by user ${req.user.id}`);
    res.status(201).json({ campaign: rows[0] });
  } catch (err) {
    logger.error('Create campaign error:', err);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// ─── GET /api/campaigns/:id ───────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM campaigns WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ campaign: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// ─── PUT /api/campaigns/:id ───────────────────────────────────
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, description, status, platforms, auto_publish, posting_frequency } = req.body;
    const { rows } = await query(
      `UPDATE campaigns SET name=$1, description=$2, status=$3, platforms=$4,
       auto_publish=$5, posting_frequency=$6, updated_at=NOW()
       WHERE id=$7 AND user_id=$8 RETURNING *`,
      [name, description, status, platforms, auto_publish, JSON.stringify(posting_frequency), req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ campaign: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// ─── DELETE /api/campaigns/:id ────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'DELETE FROM campaigns WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ message: 'Campaign deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// ─── POST /api/campaigns/:id/generate-content ─────────────────
router.post('/:id/generate-content', authenticate, async (req, res) => {
  try {
    const { rows: campaignRows } = await query(
      'SELECT * FROM campaigns WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!campaignRows[0]) return res.status(404).json({ error: 'Campaign not found' });

    const campaign = campaignRows[0];
    const { count = 1, topics = [] } = req.body;

    const generatedPosts = [];

    for (let i = 0; i < count; i++) {
      const topic = topics[i] || campaign.niche || 'general content';
      
      const content = await AIService.generateTextContent({
        userId: req.user.id,
        topic,
        platforms: campaign.platforms,
        tone: campaign.tone,
        language: campaign.language,
        brandVoice: campaign.brand_voice,
        targetAudience: campaign.target_audience
      });

      // Create post
      const { rows: postRows } = await query(
        `INSERT INTO posts
           (user_id, campaign_id, content_text, platform_data, status, ai_generated, ai_prompt, tone, language)
         VALUES ($1, $2, $3, $4, 'draft', true, $5, $6, $7)
         RETURNING *`,
        [req.user.id, campaign.id, topic, JSON.stringify(content), topic, campaign.tone, campaign.language]
      );

      generatedPosts.push(postRows[0]);

      // Auto-publish if enabled
      if (campaign.auto_publish) {
        const scheduledAt = new Date(Date.now() + (i * 60 * 60 * 1000)); // Spread by 1 hour
        await PublishingService.schedulePost(postRows[0].id, campaign.social_account_ids, scheduledAt);
      }
    }

    await query(
      'UPDATE campaigns SET posts_generated = posts_generated + $1 WHERE id = $2',
      [count, campaign.id]
    );

    res.json({ posts: generatedPosts, count: generatedPosts.length });
  } catch (err) {
    logger.error('Campaign content generation error:', err);
    res.status(500).json({ error: 'Failed to generate campaign content' });
  }
});

// ─── POST /api/campaigns/:id/pause ────────────────────────────
router.post('/:id/pause', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE campaigns SET status = 'paused', updated_at = NOW()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ campaign: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to pause campaign' });
  }
});

// ─── POST /api/campaigns/:id/resume ───────────────────────────
router.post('/:id/resume', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE campaigns SET status = 'active', updated_at = NOW()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ campaign: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resume campaign' });
  }
});

module.exports = router;
