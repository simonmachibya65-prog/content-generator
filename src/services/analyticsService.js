/**
 * Analytics Service
 * Comprehensive analytics for content performance, audience growth, and platform insights
 */

const db = require('../database');
const logger = require('../utils/logger');

class AnalyticsService {
  
  // ─── OVERVIEW ANALYTICS ────────────────────────────────────

  /**
   * Get comprehensive analytics overview
   */
  async getOverview(userId, dateRange = 30) {
    const since = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);

    const result = await db.query(
      `SELECT 
        -- Post counts
        COUNT(DISTINCT p.id) FILTER (WHERE p.created_at >= $2) as total_posts,
        COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'published' AND p.published_at >= $2) as published_posts,
        COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'scheduled') as scheduled_posts,
        -- Engagement metrics
        COALESCE(SUM(pa.views), 0) as total_views,
        COALESCE(SUM(pa.likes), 0) as total_likes,
        COALESCE(SUM(pa.comments), 0) as total_comments,
        COALESCE(SUM(pa.shares), 0) as total_shares,
        COALESCE(SUM(pa.clicks), 0) as total_clicks,
        COALESCE(AVG(pa.engagement_rate), 0) as avg_engagement_rate,
        -- Platform counts
        COUNT(DISTINCT sa.id) as connected_accounts
      FROM posts p
      LEFT JOIN publishing_jobs pj ON pj.post_id = p.id AND pj.user_id = $1
      LEFT JOIN post_analytics pa ON pa.publishing_job_id = pj.id AND pa.synced_at >= $2
      LEFT JOIN social_accounts sa ON sa.user_id = $1 AND sa.status = 'connected'
      WHERE p.user_id = $1`,
      [userId, since]
    );

    return result.rows[0];
  }

  /**
   * Get engagement trends over time
   */
  async getEngagementTrends(userId, dateRange = 30) {
    const since = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);

    const result = await db.query(
      `SELECT 
        DATE(pa.synced_at) as date,
        SUM(pa.views) as views,
        SUM(pa.likes) as likes,
        SUM(pa.comments) as comments,
        SUM(pa.shares) as shares,
        AVG(pa.engagement_rate) as engagement_rate
      FROM post_analytics pa
      JOIN publishing_jobs pj ON pj.id = pa.publishing_job_id
      WHERE pj.user_id = $1 AND pa.synced_at >= $2
      GROUP BY DATE(pa.synced_at)
      ORDER BY date ASC`,
      [userId, since]
    );

    return result.rows;
  }

  // ─── CONTENT PERFORMANCE ───────────────────────────────────

  /**
   * Get top performing posts
   */
  async getTopPosts(userId, options = {}) {
    const {
      platform = null,
      metric = 'views',
      dateRange = 30,
      limit = 10
    } = options;

    const since = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);
    const validMetrics = ['views', 'likes', 'comments', 'shares', 'engagement_rate'];
    const sortMetric = validMetrics.includes(metric) ? metric : 'views';

    let query = `
      SELECT 
        p.id,
        p.title,
        p.content_text,
        p.hashtags,
        pj.platform_name,
        pj.platform_post_url,
        pj.published_at,
        pa.views,
        pa.likes,
        pa.comments,
        pa.shares,
        pa.saves,
        pa.clicks,
        pa.reach,
        pa.impressions,
        pa.engagement_rate
      FROM post_analytics pa
      JOIN publishing_jobs pj ON pj.id = pa.publishing_job_id
      JOIN posts p ON p.id = pj.post_id
      WHERE pj.user_id = $1 AND pa.synced_at >= $2
    `;

    const params = [userId, since];
    let paramIndex = 3;

    if (platform) {
      query += ` AND pj.platform_name = $${paramIndex}`;
      params.push(platform);
      paramIndex++;
    }

    query += ` ORDER BY pa.${sortMetric} DESC NULLS LAST LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get worst performing posts
   */
  async getWorstPosts(userId, options = {}) {
    const {
      platform = null,
      metric = 'engagement_rate',
      dateRange = 30,
      limit = 10
    } = options;

    const since = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);
    const validMetrics = ['views', 'likes', 'engagement_rate'];
    const sortMetric = validMetrics.includes(metric) ? metric : 'engagement_rate';

    let query = `
      SELECT 
        p.id,
        p.title,
        p.content_text,
        pj.platform_name,
        pj.published_at,
        pa.views,
        pa.likes,
        pa.comments,
        pa.engagement_rate
      FROM post_analytics pa
      JOIN publishing_jobs pj ON pj.id = pa.publishing_job_id
      JOIN posts p ON p.id = pj.post_id
      WHERE pj.user_id = $1 AND pa.synced_at >= $2
    `;

    const params = [userId, since];
    let paramIndex = 3;

    if (platform) {
      query += ` AND pj.platform_name = $${paramIndex}`;
      params.push(platform);
      paramIndex++;
    }

    query += ` ORDER BY pa.${sortMetric} ASC NULLS LAST LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get content type performance breakdown
   */
  async getContentTypePerformance(userId, dateRange = 30) {
    const since = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);

    const result = await db.query(
      `SELECT 
        CASE 
          WHEN array_length(p.media_ids, 1) = 0 THEN 'text'
          WHEN array_length(p.media_ids, 1) = 1 THEN 'image'
          WHEN array_length(p.media_ids, 1) > 1 THEN 'carousel'
          ELSE 'unknown'
        END as content_type,
        COUNT(p.id) as post_count,
        AVG(pa.views) as avg_views,
        AVG(pa.likes) as avg_likes,
        AVG(pa.comments) as avg_comments,
        AVG(pa.engagement_rate) as avg_engagement_rate
      FROM posts p
      JOIN publishing_jobs pj ON pj.post_id = p.id
      LEFT JOIN post_analytics pa ON pa.publishing_job_id = pj.id
      WHERE p.user_id = $1 AND pj.published_at >= $2
      GROUP BY content_type
      ORDER BY avg_engagement_rate DESC`,
      [userId, since]
    );

    return result.rows;
  }

  // ─── PLATFORM ANALYTICS ────────────────────────────────────

  /**
   * Get platform-specific performance
   */
  async getPlatformPerformance(userId, dateRange = 30) {
    const since = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);

    const result = await db.query(
      `SELECT 
        pj.platform_name,
        COUNT(DISTINCT pj.id) as post_count,
        SUM(pa.views) as total_views,
        SUM(pa.likes) as total_likes,
        SUM(pa.comments) as total_comments,
        SUM(pa.shares) as total_shares,
        AVG(pa.engagement_rate) as avg_engagement_rate,
        SUM(pa.reach) as total_reach,
        SUM(pa.impressions) as total_impressions
      FROM publishing_jobs pj
      LEFT JOIN post_analytics pa ON pa.publishing_job_id = pj.id
      WHERE pj.user_id = $1 AND pj.published_at >= $2
      GROUP BY pj.platform_name
      ORDER BY total_views DESC`,
      [userId, since]
    );

    return result.rows;
  }

  /**
   * Get detailed platform analytics
   */
  async getPlatformDetails(userId, platform, dateRange = 30) {
    const since = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);

    // Platform summary
    const summary = await db.query(
      `SELECT 
        COUNT(DISTINCT pj.id) as post_count,
        SUM(pa.views) as total_views,
        SUM(pa.likes) as total_likes,
        SUM(pa.comments) as total_comments,
        SUM(pa.shares) as total_shares,
        AVG(pa.engagement_rate) as avg_engagement_rate
      FROM publishing_jobs pj
      LEFT JOIN post_analytics pa ON pa.publishing_job_id = pj.id
      WHERE pj.user_id = $1 AND pj.platform_name = $2 AND pj.published_at >= $3`,
      [userId, platform, since]
    );

    // Top posts for this platform
    const topPosts = await this.getTopPosts(userId, { platform, limit: 5, dateRange });

    // Posting times analysis
    const postingTimes = await db.query(
      `SELECT 
        EXTRACT(HOUR FROM pj.published_at) as hour,
        COUNT(*) as post_count,
        AVG(pa.engagement_rate) as avg_engagement
      FROM publishing_jobs pj
      LEFT JOIN post_analytics pa ON pa.publishing_job_id = pj.id
      WHERE pj.user_id = $1 AND pj.platform_name = $2 AND pj.published_at >= $3
      GROUP BY hour
      ORDER BY hour`,
      [userId, platform, since]
    );

    return {
      summary: summary.rows[0],
      topPosts,
      postingTimes: postingTimes.rows
    };
  }

  // ─── AUDIENCE GROWTH ───────────────────────────────────────

  /**
   * Get follower growth over time
   */
  async getFollowerGrowth(userId, dateRange = 30) {
    const since = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);

    const result = await db.query(
      `SELECT 
        aa.recorded_at as date,
        sa.platform_name,
        sa.username,
        aa.followers_count,
        aa.following_count,
        aa.posts_count
      FROM account_analytics aa
      JOIN social_accounts sa ON sa.id = aa.social_account_id
      WHERE sa.user_id = $1 AND aa.recorded_at >= $2
      ORDER BY aa.recorded_at ASC, sa.platform_name`,
      [userId, since]
    );

    return result.rows;
  }

  /**
   * Get follower growth rate
   */
  async getGrowthRate(userId, dateRange = 30) {
    const since = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);

    const result = await db.query(
      `WITH ranked_data AS (
        SELECT 
          sa.platform_name,
          aa.followers_count,
          aa.recorded_at,
          ROW_NUMBER() OVER (PARTITION BY sa.id ORDER BY aa.recorded_at ASC) as rn,
          COUNT(*) OVER (PARTITION BY sa.id) as total_records
        FROM account_analytics aa
        JOIN social_accounts sa ON sa.id = aa.social_account_id
        WHERE sa.user_id = $1 AND aa.recorded_at >= $2
      ),
      first_last AS (
        SELECT 
          platform_name,
          MAX(CASE WHEN rn = 1 THEN followers_count END) as first_count,
          MAX(CASE WHEN rn = total_records THEN followers_count END) as last_count
        FROM ranked_data
        GROUP BY platform_name
      )
      SELECT 
        platform_name,
        first_count,
        last_count,
        last_count - first_count as growth,
        CASE 
          WHEN first_count > 0 
          THEN ((last_count::float - first_count::float) / first_count::float * 100)
          ELSE 0 
        END as growth_rate
      FROM first_last
      ORDER BY growth DESC`,
      [userId, since]
    );

    return result.rows;
  }

  // ─── HASHTAG PERFORMANCE ───────────────────────────────────

  /**
   * Get hashtag performance analysis
   */
  async getHashtagPerformance(userId, dateRange = 30) {
    const since = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);

    const result = await db.query(
      `SELECT 
        UNNEST(p.hashtags) as hashtag,
        COUNT(p.id) as usage_count,
        AVG(pa.views) as avg_views,
        AVG(pa.likes) as avg_likes,
        AVG(pa.engagement_rate) as avg_engagement_rate
      FROM posts p
      JOIN publishing_jobs pj ON pj.post_id = p.id
      LEFT JOIN post_analytics pa ON pa.publishing_job_id = pj.id
      WHERE p.user_id = $1 AND pj.published_at >= $2 AND array_length(p.hashtags, 1) > 0
      GROUP BY hashtag
      HAVING COUNT(p.id) >= 2
      ORDER BY avg_engagement_rate DESC
      LIMIT 20`,
      [userId, since]
    );

    return result.rows;
  }

  // ─── BEST TIMES TO POST ────────────────────────────────────

  /**
   * Analyze best times to post by platform
   */
  async getBestPostingTimes(userId, platform = null, dateRange = 30) {
    const since = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);

    let query = `
      SELECT 
        pj.platform_name,
        EXTRACT(DOW FROM pj.published_at) as day_of_week,
        EXTRACT(HOUR FROM pj.published_at) as hour,
        COUNT(*) as post_count,
        AVG(pa.engagement_rate) as avg_engagement_rate,
        AVG(pa.views) as avg_views
      FROM publishing_jobs pj
      LEFT JOIN post_analytics pa ON pa.publishing_job_id = pj.id
      WHERE pj.user_id = $1 AND pj.published_at >= $2
    `;

    const params = [userId, since];

    if (platform) {
      params.push(platform);
      query += ` AND pj.platform_name = $3`;
    }

    query += `
      GROUP BY pj.platform_name, day_of_week, hour
      HAVING COUNT(*) >= 2
      ORDER BY avg_engagement_rate DESC
      LIMIT 10
    `;

    const result = await db.query(query, params);
    return result.rows;
  }

  // ─── COMPARISON ANALYTICS ──────────────────────────────────

  /**
   * Compare performance across periods
   */
  async getPerformanceComparison(userId, currentDays = 30, previousDays = 30) {
    const currentStart = new Date(Date.now() - currentDays * 24 * 60 * 60 * 1000);
    const previousStart = new Date(Date.now() - (currentDays + previousDays) * 24 * 60 * 60 * 1000);

    const result = await db.query(
      `SELECT 
        SUM(CASE WHEN pj.published_at >= $2 THEN pa.views ELSE 0 END) as current_views,
        SUM(CASE WHEN pj.published_at < $2 AND pj.published_at >= $3 THEN pa.views ELSE 0 END) as previous_views,
        SUM(CASE WHEN pj.published_at >= $2 THEN pa.likes ELSE 0 END) as current_likes,
        SUM(CASE WHEN pj.published_at < $2 AND pj.published_at >= $3 THEN pa.likes ELSE 0 END) as previous_likes,
        AVG(CASE WHEN pj.published_at >= $2 THEN pa.engagement_rate END) as current_engagement,
        AVG(CASE WHEN pj.published_at < $2 AND pj.published_at >= $3 THEN pa.engagement_rate END) as previous_engagement
      FROM publishing_jobs pj
      LEFT JOIN post_analytics pa ON pa.publishing_job_id = pj.id
      WHERE pj.user_id = $1 AND pj.published_at >= $3`,
      [userId, currentStart, previousStart]
    );

    const data = result.rows[0];
    
    return {
      current: {
        views: parseInt(data.current_views || 0),
        likes: parseInt(data.current_likes || 0),
        engagement: parseFloat(data.current_engagement || 0)
      },
      previous: {
        views: parseInt(data.previous_views || 0),
        likes: parseInt(data.previous_likes || 0),
        engagement: parseFloat(data.previous_engagement || 0)
      },
      changes: {
        views: this.calculatePercentageChange(data.previous_views, data.current_views),
        likes: this.calculatePercentageChange(data.previous_likes, data.current_likes),
        engagement: this.calculatePercentageChange(data.previous_engagement, data.current_engagement)
      }
    };
  }

  // ─── HELPER METHODS ────────────────────────────────────────

  calculatePercentageChange(oldValue, newValue) {
    if (!oldValue || oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  // ─── AI INTELLIGENCE FEATURES ──────────────────────────────

  /**
   * Get competitor analysis
   */
  async getCompetitorAnalysis(userId) {
    const result = await db.query(
      `SELECT id, name, platform, url, followers_estimate, last_post_date, 
              avg_engagement_rate, content_frequency, created_at
       FROM competitors
       WHERE user_id = $1
       ORDER BY avg_engagement_rate DESC NULLS LAST`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Add competitor for tracking
   */
  async addCompetitor(userId, { name, platform, url }) {
    const result = await db.query(
      `INSERT INTO competitors (user_id, name, platform, url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, name, platform, url]
    );

    return result.rows[0];
  }

  /**
   * Remove competitor
   */
  async removeCompetitor(userId, competitorId) {
    await db.query(
      `DELETE FROM competitors WHERE id = $1 AND user_id = $2`,
      [competitorId, userId]
    );
  }

  /**
   * Get trending topics (mock data with AI simulation)
   */
  async getTrendingTopics(industry, country = 'US') {
    // In production, this would call external APIs like Google Trends, Twitter API, etc.
    // For now, return mock trending data
    const mockTrends = [
      {
        topic: 'AI-generated content',
        volume: 125000,
        growth: '+45%',
        related_hashtags: ['#AI', '#ContentCreation', '#GenerativeAI'],
        platforms: ['linkedin', 'x', 'instagram']
      },
      {
        topic: 'Sustainability marketing',
        volume: 89000,
        growth: '+32%',
        related_hashtags: ['#Sustainability', '#GreenBusiness', '#EcoFriendly'],
        platforms: ['instagram', 'facebook', 'linkedin']
      },
      {
        topic: 'Short-form video',
        volume: 210000,
        growth: '+67%',
        related_hashtags: ['#Shorts', '#Reels', '#TikTok'],
        platforms: ['tiktok', 'instagram', 'youtube']
      },
      {
        topic: 'User-generated content',
        volume: 95000,
        growth: '+28%',
        related_hashtags: ['#UGC', '#CommunityDriven', '#Authentic'],
        platforms: ['instagram', 'tiktok', 'x']
      }
    ];

    return mockTrends.filter(t => 
      !industry || t.topic.toLowerCase().includes(industry.toLowerCase())
    ).slice(0, 10);
  }

  /**
   * Research hashtags
   */
  async researchHashtags(searchQuery, platform) {
    // In production, this would call platform APIs or third-party hashtag tools
    // For now, return mock data based on query
    const baseHashtags = searchQuery ? searchQuery.toLowerCase().split(' ') : ['trending'];
    
    const mockResults = baseHashtags.flatMap(base => [
      {
        hashtag: `#${base}`,
        posts_count: Math.floor(Math.random() * 1000000) + 50000,
        engagement_rate: (Math.random() * 5 + 2).toFixed(2),
        difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
        trending: Math.random() > 0.7
      },
      {
        hashtag: `#${base}tips`,
        posts_count: Math.floor(Math.random() * 500000) + 10000,
        engagement_rate: (Math.random() * 4 + 3).toFixed(2),
        difficulty: ['easy', 'medium'][Math.floor(Math.random() * 2)],
        trending: Math.random() > 0.8
      },
      {
        hashtag: `#${base}2024`,
        posts_count: Math.floor(Math.random() * 200000) + 5000,
        engagement_rate: (Math.random() * 6 + 1).toFixed(2),
        difficulty: 'easy',
        trending: true
      }
    ]);

    return mockResults.slice(0, 12);
  }

  /**
   * Optimize caption using AI analysis
   */
  async optimizeCaption(caption, platform, contentType) {
    // In production, this would use OpenAI or similar
    const analysis = {
      score: 0,
      readability: 0,
      sentiment: 'neutral',
      hashtag_count: 0,
      emoji_count: 0,
      call_to_action: false,
      character_count: caption.length
    };

    // Analyze hashtags
    const hashtagMatches = caption.match(/#[\w]+/g);
    analysis.hashtag_count = hashtagMatches ? hashtagMatches.length : 0;

    // Analyze emojis (simplified)
    analysis.emoji_count = (caption.match(/[\u{1F600}-\u{1F6FF}]/gu) || []).length;

    // Check for CTA
    const ctaKeywords = ['click', 'link', 'bio', 'shop', 'buy', 'subscribe', 'follow', 'comment', 'share', 'tag'];
    analysis.call_to_action = ctaKeywords.some(kw => caption.toLowerCase().includes(kw));

    // Calculate score
    let score = 50; // base score
    if (analysis.hashtag_count >= 3 && analysis.hashtag_count <= 10) score += 20;
    if (analysis.emoji_count > 0 && analysis.emoji_count <= 5) score += 15;
    if (analysis.call_to_action) score += 15;
    if (caption.length >= 100 && caption.length <= 500) score += 10;
    analysis.score = Math.min(score, 100);

    // Generate suggestions
    const suggestions = [];
    if (analysis.hashtag_count < 3) {
      suggestions.push('Add 3-5 relevant hashtags to increase discoverability');
    }
    if (analysis.emoji_count === 0) {
      suggestions.push('Consider adding 1-2 emojis to make the caption more engaging');
    }
    if (!analysis.call_to_action) {
      suggestions.push('Include a call-to-action to drive engagement (e.g., "Comment below", "Link in bio")');
    }
    if (caption.length < 100) {
      suggestions.push('Expand your caption to provide more value and context');
    }
    if (caption.length > 500) {
      suggestions.push('Consider shortening your caption for better readability on mobile');
    }

    return {
      original: caption,
      analysis,
      suggestions,
      optimized: null // In production, would generate an optimized version with AI
    };
  }

  /**
   * Predict post performance
   */
  async predictPerformance(userId, { caption, platform, contentType, scheduledTime }) {
    // Get historical data for this user and platform
    const historical = await db.query(
      `SELECT AVG(pa.views) as avg_views,
              AVG(pa.likes) as avg_likes,
              AVG(pa.comments) as avg_comments,
              AVG(pa.engagement_rate) as avg_engagement
       FROM post_analytics pa
       JOIN publishing_jobs pj ON pj.id = pa.publishing_job_id
       WHERE pj.user_id = $1 AND pj.platform_name = $2
       LIMIT 100`,
      [userId, platform]
    );

    const baseline = historical.rows[0] || {
      avg_views: 100,
      avg_likes: 10,
      avg_comments: 2,
      avg_engagement: 3.5
    };

    // Apply multipliers based on factors
    let multiplier = 1.0;

    // Time of day factor
    if (scheduledTime) {
      const hour = new Date(scheduledTime).getHours();
      if (hour >= 9 && hour <= 11) multiplier *= 1.2; // Morning boost
      if (hour >= 18 && hour <= 21) multiplier *= 1.3; // Evening boost
      if (hour >= 0 && hour <= 5) multiplier *= 0.7; // Late night penalty
    }

    // Content type factor
    if (contentType === 'video') multiplier *= 1.4;
    if (contentType === 'carousel') multiplier *= 1.2;
    if (contentType === 'image') multiplier *= 1.1;

    // Caption quality factor (simplified)
    const hasHashtags = /#\w+/.test(caption);
    if (hasHashtags) multiplier *= 1.1;

    const prediction = {
      estimated_views: Math.round(parseFloat(baseline.avg_views) * multiplier),
      estimated_likes: Math.round(parseFloat(baseline.avg_likes) * multiplier),
      estimated_comments: Math.round(parseFloat(baseline.avg_comments) * multiplier),
      estimated_engagement_rate: (parseFloat(baseline.avg_engagement) * multiplier).toFixed(2),
      confidence: 'medium',
      factors: {
        time_of_day: scheduledTime ? 'favorable' : 'unknown',
        content_type: contentType || 'text',
        historical_performance: 'average'
      }
    };

    return prediction;
  }

  /**
   * Get audience insights
   */
  async getAudienceInsights(userId, platform, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get engagement patterns
    const patterns = await db.query(
      `SELECT 
        EXTRACT(DOW FROM pj.published_at) as day_of_week,
        EXTRACT(HOUR FROM pj.published_at) as hour,
        AVG(pa.engagement_rate) as avg_engagement
       FROM publishing_jobs pj
       JOIN post_analytics pa ON pa.publishing_job_id = pj.id
       WHERE pj.user_id = $1 AND pj.published_at >= $2
       ${platform ? 'AND pj.platform_name = $3' : ''}
       GROUP BY day_of_week, hour
       ORDER BY avg_engagement DESC
       LIMIT 10`,
      platform ? [userId, since, platform] : [userId, since]
    );

    // Mock demographic data (in production, from platform APIs)
    const demographics = {
      age_groups: [
        { range: '18-24', percentage: 25 },
        { range: '25-34', percentage: 35 },
        { range: '35-44', percentage: 20 },
        { range: '45-54', percentage: 12 },
        { range: '55+', percentage: 8 }
      ],
      gender: [
        { label: 'Female', percentage: 55 },
        { label: 'Male', percentage: 42 },
        { label: 'Other', percentage: 3 }
      ],
      top_locations: [
        { country: 'United States', percentage: 45 },
        { country: 'United Kingdom', percentage: 15 },
        { country: 'Canada', percentage: 10 },
        { country: 'Australia', percentage: 8 },
        { country: 'Germany', percentage: 5 }
      ]
    };

    return {
      engagement_patterns: patterns.rows,
      demographics,
      best_times: patterns.rows.slice(0, 3)
    };
  }

  /**
   * Get A/B tests
   */
  async getABTests(userId) {
    const result = await db.query(
      `SELECT id, name, variant_a, variant_b, platform, test_type,
              status, winner, created_at, completed_at
       FROM ab_tests
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Create A/B test
   */
  async createABTest(userId, { name, variantA, variantB, platform, testType }) {
    const result = await db.query(
      `INSERT INTO ab_tests (user_id, name, variant_a, variant_b, platform, test_type, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active')
       RETURNING *`,
      [userId, name, JSON.stringify(variantA), JSON.stringify(variantB), platform, testType]
    );

    return result.rows[0];
  }

  /**
   * Calculate ROI
   */
  async calculateROI({ adSpend, revenue, timeInvested, contentCosts }) {
    const totalCosts = (adSpend || 0) + (contentCosts || 0) + (timeInvested || 0);
    const profit = (revenue || 0) - totalCosts;
    const roiPercentage = totalCosts > 0 ? ((profit / totalCosts) * 100).toFixed(2) : 0;

    return {
      total_costs: totalCosts,
      revenue: revenue || 0,
      profit,
      roi_percentage: parseFloat(roiPercentage),
      breakdown: {
        ad_spend: adSpend || 0,
        content_costs: contentCosts || 0,
        time_invested: timeInvested || 0
      },
      recommendation: roiPercentage > 100 
        ? 'Excellent ROI! Consider scaling your investment.'
        : roiPercentage > 0 
        ? 'Positive ROI. Look for optimization opportunities.'
        : 'Negative ROI. Review and optimize your strategy.'
    };
  }
}

module.exports = new AnalyticsService();
