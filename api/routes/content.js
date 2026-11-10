const express = require('express');
const { authenticate, requireAICredits } = require('../middleware/auth');
const { query } = require('../database');
const AIService = require('../services/aiService');
const logger = require('../utils/logger');

const router = express.Router();

// ─── POST /api/content/generate ───────────────────────────────
router.post('/generate', authenticate, requireAICredits, async (req, res) => {
  try {
    const { topic, platforms, tone, language, brand_voice, target_audience } = req.body;

    if (!topic || !platforms?.length) {
      return res.status(400).json({ error: 'Topic and at least one platform required' });
    }

    const content = await AIService.generateTextContent({
      userId: req.user.id,
      topic, platforms, tone, language,
      brandVoice: brand_voice,
      targetAudience: target_audience
    });

    res.json({ content, credits_used: 1 });
  } catch (err) {
    logger.error('Content generation error:', err);
    res.status(500).json({ error: 'Content generation failed' });
  }
});

// ─── POST /api/content/generate-hashtags ──────────────────────
router.post('/generate-hashtags', authenticate, async (req, res) => {
  try {
    const { topic, platform, count } = req.body;
    const hashtags = await AIService.generateHashtags({ topic, platform, count });
    res.json({ hashtags });
  } catch (err) {
    res.status(500).json({ error: 'Hashtag generation failed' });
  }
});

// ─── POST /api/content/generate-script ────────────────────────
router.post('/generate-script', authenticate, requireAICredits, async (req, res) => {
  try {
    const { topic, platform, duration, tone, language } = req.body;
    const script = await AIService.generateVideoScript({
      userId: req.user.id, topic, platform, duration, tone, language
    });
    res.json({ script, credits_used: 2 });
  } catch (err) {
    res.status(500).json({ error: 'Script generation failed' });
  }
});

// ─── POST /api/content/repurpose ──────────────────────────────
router.post('/repurpose', authenticate, requireAICredits, async (req, res) => {
  try {
    const { original_content, source_format, target_platforms, tone } = req.body;
    const repurposed = await AIService.repurposeContent({
      userId: req.user.id,
      originalContent: original_content,
      sourceFormat: source_format,
      targetPlatforms: target_platforms,
      tone
    });
    res.json({ repurposed, credits_used: 2 });
  } catch (err) {
    res.status(500).json({ error: 'Content repurposing failed' });
  }
});

// ─── POST /api/content/generate-image ─────────────────────────
router.post('/generate-image', authenticate, requireAICredits, async (req, res) => {
  try {
    const { prompt, topic, platform, style, size } = req.body;

    let finalPrompt = prompt;
    if (!finalPrompt && topic) {
      const promptData = await AIService.generateImagePrompt({ topic, platform, style });
      finalPrompt = promptData.prompt;
    }

    const image = await AIService.generateImage({
      userId: req.user.id, prompt: finalPrompt, size
    });

    res.json({ image, credits_used: 3 });
  } catch (err) {
    logger.error('Image generation error:', err);
    res.status(500).json({ error: 'Image generation failed' });
  }
});

// ─── GET /api/content/best-times ──────────────────────────────
router.get('/best-times/:platform', authenticate, async (req, res) => {
  const times = AIService.getBestPostingTimes(req.params.platform, req.user.timezone);
  res.json({ platform: req.params.platform, times });
});

// ─── POST /api/content/generate-carousel ──────────────────────
router.post('/generate-carousel', authenticate, requireAICredits, async (req, res) => {
  try {
    const { topic, slides = 5, platform, tone } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic required' });

    const result = await AIService.generateCarousel({ userId: req.user.id, topic, slides, platform, tone });
    res.json({ ...result, credits_used: 2 });
  } catch (err) {
    logger.error('Carousel generation error:', err);
    res.status(500).json({ error: 'Carousel generation failed' });
  }
});

// ─── POST /api/content/generate-ad ────────────────────────────
router.post('/generate-ad', authenticate, requireAICredits, async (req, res) => {
  try {
    const { product, goal, platform, tone } = req.body;
    if (!product) return res.status(400).json({ error: 'Product/service required' });

    const result = await AIService.generateAdCopy({ userId: req.user.id, product, goal, platform, tone });
    res.json({ ...result, credits_used: 2 });
  } catch (err) {
    logger.error('Ad copy generation error:', err);
    res.status(500).json({ error: 'Ad copy generation failed' });
  }
});

// ─── POST /api/content/ideas ──────────────────────────────────
router.post('/ideas', authenticate, async (req, res) => {
  try {
    const { platform = 'instagram', count = 10 } = req.body;

    const { rows: profileRows } = await query(
      'SELECT * FROM business_profiles WHERE user_id = $1',
      [req.user.id]
    );
    const { rows: biRows } = await query(
      `SELECT bi.* FROM brand_intelligence bi
       JOIN business_profiles bp ON bi.business_profile_id = bp.id
       WHERE bp.user_id = $1`,
      [req.user.id]
    );

    const ideas = await AIService.generateContentIdeas({
      profile: profileRows[0] || { business_name: 'My Business', industry: 'General', products: '' },
      brandIntelligence: biRows[0],
      platform,
      count
    });

    await query('UPDATE users SET ai_credits_used = ai_credits_used + 1 WHERE id = $1', [req.user.id]);
    res.json(ideas);
  } catch (err) {
    logger.error('Content ideas error:', err);
    res.status(500).json({ error: 'Failed to generate content ideas' });
  }
});

// ─── POST /api/content/posts ──────────────────────────────────
// Save a post (draft or scheduled)
router.post('/posts', authenticate, async (req, res) => {
  try {
    const {
      title, content_text, hashtags, media_ids, platform_data,
      status, scheduled_at, ai_generated, ai_prompt, tone, language, campaign_id
    } = req.body;

    const { rows } = await query(
      `INSERT INTO posts
         (user_id, campaign_id, title, content_text, hashtags, media_ids, platform_data,
          status, scheduled_at, ai_generated, ai_prompt, tone, language)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        req.user.id, campaign_id || null, title, content_text,
        hashtags || [], media_ids || [], JSON.stringify(platform_data || {}),
        status || 'draft', scheduled_at || null,
        ai_generated || false, ai_prompt || null, tone || null, language || 'en'
      ]
    );

    res.status(201).json({ post: rows[0] });
  } catch (err) {
    logger.error('Save post error:', err);
    res.status(500).json({ error: 'Failed to save post' });
  }
});

// ─── GET /api/content/posts ───────────────────────────────────
router.get('/posts', authenticate, async (req, res) => {
  try {
    const { status, platform, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT p.*, COUNT(*) OVER() AS total_count
               FROM posts p
               WHERE p.user_id = $1`;
    const params = [req.user.id];

    if (status) { params.push(status); sql += ` AND p.status = $${params.length}`; }

    sql += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await query(sql, params);
    const total = rows[0]?.total_count || 0;

    res.json({ posts: rows, pagination: { page: +page, limit: +limit, total: +total } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// ─── GET /api/content/posts/:id ───────────────────────────────
router.get('/posts/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM posts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Post not found' });
    res.json({ post: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// ─── PUT /api/content/posts/:id ───────────────────────────────
router.put('/posts/:id', authenticate, async (req, res) => {
  try {
    const { title, content_text, hashtags, platform_data, status, scheduled_at } = req.body;
    const { rows } = await query(
      `UPDATE posts SET title=$1, content_text=$2, hashtags=$3, platform_data=$4,
       status=$5, scheduled_at=$6, updated_at=NOW()
       WHERE id=$7 AND user_id=$8 RETURNING *`,
      [title, content_text, hashtags, JSON.stringify(platform_data), status, scheduled_at, req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Post not found' });
    res.json({ post: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// ─── DELETE /api/content/posts/:id ────────────────────────────
router.delete('/posts/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Post not found' });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

module.exports = router;


// ─── APPROVAL WORKFLOW ENDPOINTS ──────────────────────────────

// ─── POST /api/content/posts/:id/request-approval ─────────────
router.post('/posts/:id/request-approval', authenticate, async (req, res) => {
  try {
    const { approver_id } = req.body;
    
    // Check if post exists
    const post = await query(
      'SELECT * FROM posts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    
    if (!post.rows[0]) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Create approval request
    const approval = await query(
      `INSERT INTO content_approvals (post_id, user_id, approver_id, status, requested_at)
       VALUES ($1, $2, $3, 'pending', NOW())
       ON CONFLICT (post_id, user_id) 
       DO UPDATE SET status = 'pending', approver_id = $3, requested_at = NOW()
       RETURNING *`,
      [req.params.id, req.user.id, approver_id]
    );

    // Update post status
    await query(
      'UPDATE posts SET status = $1 WHERE id = $2',
      ['pending_approval', req.params.id]
    );

    res.json({ success: true, approval: approval.rows[0] });
  } catch (err) {
    logger.error('Request approval error:', err);
    res.status(500).json({ error: 'Failed to request approval' });
  }
});

// ─── GET /api/content/approvals/pending ───────────────────────
router.get('/approvals/pending', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT ca.*, p.title, p.content_text, p.media_ids, u.full_name as creator_name
       FROM content_approvals ca
       JOIN posts p ON p.id = ca.post_id
       JOIN users u ON u.id = ca.user_id
       WHERE ca.approver_id = $1 AND ca.status = 'pending'
       ORDER BY ca.requested_at DESC`,
      [req.user.id]
    );

    res.json({ approvals: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending approvals' });
  }
});

// ─── GET /api/content/approvals/my-requests ───────────────────
router.get('/approvals/my-requests', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT ca.*, p.title, p.content_text, u.full_name as approver_name
       FROM content_approvals ca
       JOIN posts p ON p.id = ca.post_id
       LEFT JOIN users u ON u.id = ca.approver_id
       WHERE ca.user_id = $1
       ORDER BY ca.requested_at DESC`,
      [req.user.id]
    );

    res.json({ requests: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch approval requests' });
  }
});

// ─── POST /api/content/approvals/:id/approve ──────────────────
router.post('/approvals/:id/approve', authenticate, async (req, res) => {
  try {
    const { feedback } = req.body;

    // Update approval status
    const approval = await query(
      `UPDATE content_approvals 
       SET status = 'approved', feedback = $1, reviewed_at = NOW()
       WHERE id = $2 AND approver_id = $3
       RETURNING *`,
      [feedback, req.params.id, req.user.id]
    );

    if (!approval.rows[0]) {
      return res.status(404).json({ error: 'Approval not found or unauthorized' });
    }

    // Update post status to ready for publishing
    await query(
      'UPDATE posts SET status = $1 WHERE id = $2',
      ['approved', approval.rows[0].post_id]
    );

    res.json({ success: true, approval: approval.rows[0] });
  } catch (err) {
    logger.error('Approve content error:', err);
    res.status(500).json({ error: 'Failed to approve content' });
  }
});

// ─── POST /api/content/approvals/:id/reject ───────────────────
router.post('/approvals/:id/reject', authenticate, async (req, res) => {
  try {
    const { feedback } = req.body;

    if (!feedback || !feedback.trim()) {
      return res.status(400).json({ error: 'Feedback is required when rejecting' });
    }

    const approval = await query(
      `UPDATE content_approvals 
       SET status = 'rejected', feedback = $1, reviewed_at = NOW()
       WHERE id = $2 AND approver_id = $3
       RETURNING *`,
      [feedback, req.params.id, req.user.id]
    );

    if (!approval.rows[0]) {
      return res.status(404).json({ error: 'Approval not found or unauthorized' });
    }

    await query(
      'UPDATE posts SET status = $1 WHERE id = $2',
      ['rejected', approval.rows[0].post_id]
    );

    res.json({ success: true, approval: approval.rows[0] });
  } catch (err) {
    logger.error('Reject content error:', err);
    res.status(500).json({ error: 'Failed to reject content' });
  }
});

// ─── POST /api/content/approvals/:id/request-changes ──────────
router.post('/approvals/:id/request-changes', authenticate, async (req, res) => {
  try {
    const { feedback } = req.body;

    if (!feedback || !feedback.trim()) {
      return res.status(400).json({ error: 'Feedback is required when requesting changes' });
    }

    const approval = await query(
      `UPDATE content_approvals 
       SET status = 'changes_requested', feedback = $1, reviewed_at = NOW()
       WHERE id = $2 AND approver_id = $3
       RETURNING *`,
      [feedback, req.params.id, req.user.id]
    );

    if (!approval.rows[0]) {
      return res.status(404).json({ error: 'Approval not found or unauthorized' });
    }

    await query(
      'UPDATE posts SET status = $1 WHERE id = $2',
      ['needs_revision', approval.rows[0].post_id]
    );

    res.json({ success: true, approval: approval.rows[0] });
  } catch (err) {
    logger.error('Request changes error:', err);
    res.status(500).json({ error: 'Failed to request changes' });
  }
});
