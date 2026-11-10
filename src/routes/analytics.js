const express = require('express');
const { authenticate } = require('../middleware/auth');
const { query } = require('../database');
const analyticsService = require('../services/analyticsService');

const router = express.Router();

// ─── GET /api/analytics/overview ──────────────────────────────
router.get('/overview', authenticate, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [posts, accounts, published, failed] = await Promise.all([
      query('SELECT COUNT(*) FROM posts WHERE user_id = $1 AND created_at >= $2', [req.user.id, since]),
      query('SELECT COUNT(*) FROM social_accounts WHERE user_id = $1 AND status = $2', [req.user.id, 'connected']),
      query('SELECT COUNT(*) FROM publishing_jobs WHERE user_id = $1 AND status = $2 AND created_at >= $3', [req.user.id, 'published', since]),
      query('SELECT COUNT(*) FROM publishing_jobs WHERE user_id = $1 AND status = $2 AND created_at >= $3', [req.user.id, 'failed', since])
    ]);

    // Total engagement
    const engagement = await query(
      `SELECT COALESCE(SUM(pa.views),0) AS total_views,
              COALESCE(SUM(pa.likes),0) AS total_likes,
              COALESCE(SUM(pa.comments),0) AS total_comments,
              COALESCE(SUM(pa.shares),0) AS total_shares
       FROM post_analytics pa
       JOIN publishing_jobs pj ON pj.id = pa.publishing_job_id
       WHERE pj.user_id = $1 AND pa.synced_at >= $2`,
      [req.user.id, since]
    );

    res.json({
      overview: {
        total_posts: +posts.rows[0].count,
        connected_accounts: +accounts.rows[0].count,
        posts_published: +published.rows[0].count,
        posts_failed: +failed.rows[0].count,
        ...engagement.rows[0]
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ─── GET /api/analytics/posts ─────────────────────────────────
router.get('/posts', authenticate, async (req, res) => {
  try {
    const { platform, days = 30, sort = 'views', limit = 10 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    let sql = `
      SELECT pj.platform_name, pj.platform_post_url, p.title, p.content_text,
             pa.views, pa.likes, pa.comments, pa.shares, pa.engagement_rate,
             pj.published_at
      FROM post_analytics pa
      JOIN publishing_jobs pj ON pj.id = pa.publishing_job_id
      JOIN posts p ON p.id = pj.post_id
      WHERE pj.user_id = $1 AND pa.synced_at >= $2`;

    const params = [req.user.id, since];
    if (platform) { params.push(platform); sql += ` AND pj.platform_name = $${params.length}`; }

    const validSorts = ['views', 'likes', 'comments', 'shares', 'engagement_rate'];
    const sortCol = validSorts.includes(sort) ? sort : 'views';
    sql += ` ORDER BY pa.${sortCol} DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const { rows } = await query(sql, params);
    res.json({ posts: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch post analytics' });
  }
});

// ─── GET /api/analytics/growth ────────────────────────────────
router.get('/growth', authenticate, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const { rows } = await query(
      `SELECT aa.recorded_at, aa.followers_count, sa.platform_name, sa.username
       FROM account_analytics aa
       JOIN social_accounts sa ON sa.id = aa.social_account_id
       WHERE sa.user_id = $1 AND aa.recorded_at >= $2
       ORDER BY aa.recorded_at ASC`,
      [req.user.id, since]
    );

    res.json({ growth: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch growth data' });
  }
});

// ─── GET /api/analytics/platforms ─────────────────────────────
router.get('/platforms', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT pj.platform_name,
              COUNT(pj.id) AS posts_count,
              COALESCE(SUM(pa.views),0) AS total_views,
              COALESCE(SUM(pa.likes),0) AS total_likes,
              COALESCE(AVG(pa.engagement_rate),0) AS avg_engagement
       FROM publishing_jobs pj
       LEFT JOIN post_analytics pa ON pa.publishing_job_id = pj.id
       WHERE pj.user_id = $1 AND pj.status = 'published'
       GROUP BY pj.platform_name
       ORDER BY total_views DESC`,
      [req.user.id]
    );
    res.json({ platforms: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch platform analytics' });
  }
});

// ─── GET /api/analytics/engagement-trends ─────────────────────
router.get('/engagement-trends', authenticate, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const trends = await analyticsService.getEngagementTrends(req.user.id, parseInt(days));
    res.json({ success: true, trends });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET /api/analytics/top-posts ─────────────────────────────
router.get('/top-posts', authenticate, async (req, res) => {
  try {
    const { platform, metric = 'views', days = 30, limit = 10 } = req.query;
    const posts = await analyticsService.getTopPosts(req.user.id, {
      platform,
      metric,
      dateRange: parseInt(days),
      limit: parseInt(limit)
    });
    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET /api/analytics/worst-posts ───────────────────────────
router.get('/worst-posts', authenticate, async (req, res) => {
  try {
    const { platform, metric = 'engagement_rate', days = 30, limit = 10 } = req.query;
    const posts = await analyticsService.getWorstPosts(req.user.id, {
      platform,
      metric,
      dateRange: parseInt(days),
      limit: parseInt(limit)
    });
    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET /api/analytics/content-types ─────────────────────────
router.get('/content-types', authenticate, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const contentTypes = await analyticsService.getContentTypePerformance(req.user.id, parseInt(days));
    res.json({ success: true, contentTypes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET /api/analytics/platform/:platform ────────────────────
router.get('/platform/:platform', authenticate, async (req, res) => {
  try {
    const { platform } = req.params;
    const { days = 30 } = req.query;
    const details = await analyticsService.getPlatformDetails(req.user.id, platform, parseInt(days));
    res.json({ success: true, ...details });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET /api/analytics/follower-growth ───────────────────────
router.get('/follower-growth', authenticate, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const growth = await analyticsService.getFollowerGrowth(req.user.id, parseInt(days));
    res.json({ success: true, growth });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET /api/analytics/growth-rate ───────────────────────────
router.get('/growth-rate', authenticate, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const rates = await analyticsService.getGrowthRate(req.user.id, parseInt(days));
    res.json({ success: true, rates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET /api/analytics/hashtags ──────────────────────────────
router.get('/hashtags', authenticate, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const hashtags = await analyticsService.getHashtagPerformance(req.user.id, parseInt(days));
    res.json({ success: true, hashtags });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET /api/analytics/best-times ────────────────────────────
router.get('/best-times', authenticate, async (req, res) => {
  try {
    const { platform, days = 30 } = req.query;
    const times = await analyticsService.getBestPostingTimes(req.user.id, platform, parseInt(days));
    res.json({ success: true, times });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET /api/analytics/comparison ────────────────────────────
router.get('/comparison', authenticate, async (req, res) => {
  try {
    const { current = 30, previous = 30 } = req.query;
    const comparison = await analyticsService.getPerformanceComparison(
      req.user.id,
      parseInt(current),
      parseInt(previous)
    );
    res.json({ success: true, comparison });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── AI Intelligence Endpoints ────────────────────────────────

// ─── GET /api/analytics/competitors ───────────────────────────
router.get('/competitors', authenticate, async (req, res) => {
  try {
    const competitors = await analyticsService.getCompetitorAnalysis(req.user.id);
    res.json({ success: true, competitors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── POST /api/analytics/competitors/add ──────────────────────
router.post('/competitors/add', authenticate, async (req, res) => {
  try {
    const { name, platform, url } = req.body;
    const competitor = await analyticsService.addCompetitor(req.user.id, { name, platform, url });
    res.json({ success: true, competitor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── DELETE /api/analytics/competitors/:id ────────────────────
router.delete('/competitors/:id', authenticate, async (req, res) => {
  try {
    await analyticsService.removeCompetitor(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET /api/analytics/trends ────────────────────────────────
router.get('/trends', authenticate, async (req, res) => {
  try {
    const { industry, country = 'US' } = req.query;
    const trends = await analyticsService.getTrendingTopics(industry, country);
    res.json({ success: true, trends });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET /api/analytics/hashtag-research ──────────────────────
router.get('/hashtag-research', authenticate, async (req, res) => {
  try {
    const { query: searchQuery, platform } = req.query;
    const hashtags = await analyticsService.researchHashtags(searchQuery, platform);
    res.json({ success: true, hashtags });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── POST /api/analytics/caption-optimizer ────────────────────
router.post('/caption-optimizer', authenticate, async (req, res) => {
  try {
    const { caption, platform, contentType } = req.body;
    const optimization = await analyticsService.optimizeCaption(caption, platform, contentType);
    res.json({ success: true, ...optimization });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── POST /api/analytics/predict-performance ──────────────────
router.post('/predict-performance', authenticate, async (req, res) => {
  try {
    const { caption, platform, contentType, scheduledTime } = req.body;
    const prediction = await analyticsService.predictPerformance(
      req.user.id,
      { caption, platform, contentType, scheduledTime }
    );
    res.json({ success: true, ...prediction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET /api/analytics/audience-insights ─────────────────────
router.get('/audience-insights', authenticate, async (req, res) => {
  try {
    const { platform, days = 30 } = req.query;
    const insights = await analyticsService.getAudienceInsights(req.user.id, platform, parseInt(days));
    res.json({ success: true, ...insights });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET /api/analytics/ab-tests ──────────────────────────────
router.get('/ab-tests', authenticate, async (req, res) => {
  try {
    const tests = await analyticsService.getABTests(req.user.id);
    res.json({ success: true, tests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── POST /api/analytics/ab-tests ─────────────────────────────
router.post('/ab-tests', authenticate, async (req, res) => {
  try {
    const { name, variantA, variantB, platform, testType } = req.body;
    const test = await analyticsService.createABTest(req.user.id, {
      name, variantA, variantB, platform, testType
    });
    res.json({ success: true, test });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── POST /api/analytics/roi-calculator ───────────────────────
router.post('/roi-calculator', authenticate, async (req, res) => {
  try {
    const { adSpend, revenue, timeInvested, contentCosts } = req.body;
    const roi = await analyticsService.calculateROI({
      adSpend, revenue, timeInvested, contentCosts
    });
    res.json({ success: true, roi });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
