const { query } = require('../database');
const AIService = require('./aiService');
const PublishingService = require('./publishingService');
const { ModelRouter } = require('./creativeStudioService');
const logger = require('../utils/logger');

/**
 * Campaign Automation Service - AI Autopilot
 * Fully autonomous content creation, scheduling, and publishing
 * Implements the complete marketing lifecycle from strategy to optimization
 */
const CampaignAutomation = {
  /**
   * Process all active campaigns and generate content
   */
  async processActiveCampaigns() {
    try {
      const { rows: campaigns } = await query(
        `SELECT c.*, u.ai_credits, u.ai_credits_used
         FROM campaigns c
         JOIN users u ON u.id = c.user_id
         WHERE c.status = 'active'
           AND (c.end_date IS NULL OR c.end_date >= CURRENT_DATE)
           AND c.auto_publish = TRUE`
      );

      logger.info(`Processing ${campaigns.length} active campaigns`);

      for (const campaign of campaigns) {
        try {
          await this.generateCampaignContent(campaign);
        } catch (err) {
          logger.error(`Campaign ${campaign.id} automation error:`, err);
        }
      }
    } catch (err) {
      logger.error('Campaign automation error:', err);
    }
  },

  /**
   * Generate content for a specific campaign
   */
  async generateCampaignContent(campaign) {
    // Check if we need to generate content based on frequency
    const frequency = campaign.posting_frequency;
    const postsPerDay = frequency?.posts_per_day || 1;
    
    // Check how many posts were scheduled today
    const { rows: todayPosts } = await query(
      `SELECT COUNT(*) as count
       FROM posts p
       JOIN publishing_jobs pj ON pj.post_id = p.id
       WHERE p.campaign_id = $1
         AND pj.scheduled_at::date = CURRENT_DATE`,
      [campaign.id]
    );

    const todayCount = parseInt(todayPosts[0].count);
    
    if (todayCount >= postsPerDay) {
      logger.info(`Campaign ${campaign.id} already has ${todayCount} posts today`);
      return;
    }

    const postsToGenerate = postsPerDay - todayCount;
    logger.info(`Generating ${postsToGenerate} posts for campaign ${campaign.id}`);

    // Generate topics based on niche
    const topics = await this.generateTopics(campaign.niche, postsToGenerate);

    for (let i = 0; i < postsToGenerate; i++) {
      try {
        const topic = topics[i] || campaign.niche;

        // Generate content
        const content = await AIService.generateTextContent({
          userId: campaign.user_id,
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
             (user_id, campaign_id, content_text, platform_data, status, 
              ai_generated, ai_prompt, tone, language)
           VALUES ($1, $2, $3, $4, 'scheduled', true, $5, $6, $7)
           RETURNING *`,
          [
            campaign.user_id,
            campaign.id,
            topic,
            JSON.stringify(content),
            topic,
            campaign.tone,
            campaign.language
          ]
        );

        const post = postRows[0];

        // Schedule posting times
        const times = frequency?.times || ['09:00', '18:00'];
        const scheduledTime = times[i % times.length];
        const [hours, minutes] = scheduledTime.split(':');
        
        const scheduledAt = new Date();
        scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // If time has passed today, schedule for tomorrow
        if (scheduledAt < new Date()) {
          scheduledAt.setDate(scheduledAt.getDate() + 1);
        }

        // Create publishing jobs
        await PublishingService.schedulePost(
          post.id,
          campaign.social_account_ids,
          scheduledAt
        );

        // Update campaign stats
        await query(
          'UPDATE campaigns SET posts_generated = posts_generated + 1 WHERE id = $1',
          [campaign.id]
        );

        logger.info(`Generated post for campaign ${campaign.id}, scheduled for ${scheduledAt}`);
      } catch (err) {
        logger.error(`Failed to generate post ${i} for campaign ${campaign.id}:`, err);
      }
    }
  },

  /**
   * Generate topic variations based on niche
   */
  async generateTopics(niche, count) {
    if (!niche) return Array(count).fill('general content');

    try {
      const response = await require('openai').default.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: `Generate ${count} specific content topic ideas for the niche: "${niche}". 
Return only a JSON array of strings. Each should be a specific, actionable content topic.
Example: ["5 tips for better sleep", "How to start meditation", "Benefits of morning routines"]`
        }],
        response_format: { type: 'json_object' },
        temperature: 0.9
      });

      const data = JSON.parse(response.choices[0].message.content);
      return data.topics || Array(count).fill(niche);
    } catch (err) {
      logger.error('Topic generation error:', err);
      return Array(count).fill(niche);
    }
  },

  /**
   * Get campaign performance summary
   */
  async getCampaignStats(campaignId) {
    const { rows } = await query(
      `SELECT
         COUNT(DISTINCT p.id) as total_posts,
         COUNT(DISTINCT pj.id) FILTER (WHERE pj.status = 'published') as published_posts,
         COALESCE(SUM(pa.views), 0) as total_views,
         COALESCE(SUM(pa.likes), 0) as total_likes,
         COALESCE(AVG(pa.engagement_rate), 0) as avg_engagement
       FROM posts p
       LEFT JOIN publishing_jobs pj ON pj.post_id = p.id
       LEFT JOIN post_analytics pa ON pa.publishing_job_id = pj.id
       WHERE p.campaign_id = $1`,
      [campaignId]
    );

    return rows[0];
  },

  /**
   * Monitor campaign performance and optimize
   */
  async monitorCampaignPerformance() {
    try {
      const { rows: campaigns } = await query(
        `SELECT c.id, c.name, c.user_id
         FROM campaigns c
         WHERE c.status = 'active'
           AND c.created_at < NOW() - INTERVAL '7 days'`
      );

      for (const campaign of campaigns) {
        const stats = await this.getCampaignStats(campaign.id);
        
        // If campaign has published >10 posts with 0 engagement, auto-pause
        if (stats.published_posts > 10 && stats.total_views === '0') {
          await query(
            'UPDATE campaigns SET status = $1 WHERE id = $2',
            ['paused', campaign.id]
          );
          
          // Create notification
          await query(
            `INSERT INTO notifications (user_id, type, title, message, data)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              campaign.user_id,
              'campaign_paused',
              'Campaign Automatically Paused',
              `Campaign "${campaign.name}" was paused due to low engagement. Review and adjust settings.`,
              JSON.stringify({ campaign_id: campaign.id })
            ]
          );

          logger.info(`Auto-paused low-performing campaign ${campaign.id}`);
        }
      }
    } catch (err) {
      logger.error('Campaign performance monitoring error:', err);
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW: AI AUTOPILOT - FULLY AUTONOMOUS MARKETING
  // ═══════════════════════════════════════════════════════════════

  /**
   * START AI AUTOPILOT
   * Launches a fully autonomous marketing campaign
   * User provides business info → System runs 30-day autonomous operation
   */
  async startAutopilot(campaignId) {
    try {
      const { rows } = await query(
        `SELECT c.*, 
                bp.business_name, bp.industry, bp.product_service,
                bp.target_audience, bp.marketing_objective, bp.brand_voice,
                bp.brand_colors, bp.languages
         FROM campaigns c
         LEFT JOIN business_profiles bp ON bp.user_id = c.user_id
         WHERE c.id = $1`,
        [campaignId]
      );

      if (!rows[0]) throw new Error('Campaign not found');
      const campaign = rows[0];

      logger.info(`🚀 Starting AI Autopilot for campaign ${campaignId}`);

      // STEP 1: Generate 30-day marketing strategy
      const strategy = await this.generateMarketingStrategy(campaign);
      
      // Save strategy
      await query(
        `UPDATE campaigns 
         SET autopilot_enabled = true,
             autopilot_strategy = $1,
             autopilot_start_date = NOW(),
             status = 'active'
         WHERE id = $2`,
        [JSON.stringify(strategy), campaignId]
      );

      // STEP 2: Generate content calendar
      const calendar = await this.generateContentCalendar(campaign, strategy);

      // STEP 3: Pre-generate first week of content
      await this.pregenerateContent(campaign, calendar.slice(0, 7));

      logger.info(`✅ Autopilot started for campaign ${campaignId} - ${strategy.content_pieces} pieces planned`);

      return { success: true, strategy, calendar };
    } catch (err) {
      logger.error('Autopilot start error:', err);
      throw err;
    }
  },

  /**
   * GENERATE 30-DAY MARKETING STRATEGY
   * AI creates comprehensive marketing plan
   */
  async generateMarketingStrategy(campaign) {
    const prompt = `You are a world-class marketing strategist. Create a complete 30-day marketing strategy.

BUSINESS CONTEXT:
- Business: ${campaign.business_name || campaign.name}
- Industry: ${campaign.industry || campaign.niche}
- Product/Service: ${campaign.product_service || campaign.description}
- Target Audience: ${campaign.target_audience}
- Marketing Objective: ${campaign.marketing_objective || 'Increase brand awareness and sales'}
- Brand Voice: ${campaign.brand_voice || campaign.tone}
- Platforms: ${campaign.platforms?.join(', ')}
- Language: ${campaign.language || 'en'}

Create a strategic 30-day plan with:

Return JSON:
{
  "objective": "Clear 30-day marketing goal",
  "target_kpis": {
    "reach": "target number",
    "engagement_rate": "target %",
    "conversions": "target number"
  },
  "content_pillars": ["pillar 1", "pillar 2", "pillar 3", "pillar 4"],
  "content_themes": {
    "week_1": ["theme1", "theme2", "theme3"],
    "week_2": ["theme1", "theme2", "theme3"],
    "week_3": ["theme1", "theme2", "theme3"],
    "week_4": ["theme1", "theme2", "theme3"]
  },
  "platform_strategy": {
    "instagram": "Strategy for Instagram",
    "tiktok": "Strategy for TikTok",
    "facebook": "Strategy for Facebook",
    "youtube": "Strategy for YouTube",
    "linkedin": "Strategy for LinkedIn",
    "x": "Strategy for X/Twitter"
  },
  "content_mix": {
    "video": 40,
    "image": 30,
    "carousel": 20,
    "text": 10
  },
  "posting_schedule": {
    "instagram": ["09:00", "18:00"],
    "tiktok": ["12:00", "20:00"],
    "facebook": ["10:00", "19:00"],
    "youtube": ["17:00"],
    "linkedin": ["08:00", "17:00"],
    "x": ["09:00", "14:00", "21:00"]
  },
  "hashtag_strategy": ["hashtag1", "hashtag2", "hashtag3"],
  "cta_strategy": "Main call-to-action approach",
  "content_pieces": 60
}`;

    const systemPrompt = 'You are an expert marketing strategist specializing in social media marketing and content strategy.';

    try {
      const response = await ModelRouter.text(prompt, systemPrompt, { json: true, maxTokens: 3000 });
      return JSON.parse(response);
    } catch (err) {
      logger.error('Strategy generation error:', err);
      // Return fallback strategy
      return {
        objective: `Grow ${campaign.business_name || 'brand'} presence`,
        content_pillars: ['Educational', 'Promotional', 'Engaging', 'Behind-the-scenes'],
        content_pieces: 60,
        posting_schedule: { instagram: ['09:00', '18:00'], tiktok: ['12:00', '20:00'] }
      };
    }
  },

  /**
   * GENERATE CONTENT CALENDAR
   * Creates 30-day schedule with specific topics per day
   */
  async generateContentCalendar(campaign, strategy) {
    const calendar = [];
    const startDate = new Date();

    for (let day = 0; day < 30; day++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + day);

      const weekIndex = Math.floor(day / 7);
      const themes = strategy.content_themes?.[`week_${weekIndex + 1}`] || strategy.content_pillars || [];

      for (const platform of (campaign.platforms || [])) {
        const times = strategy.posting_schedule?.[platform] || ['09:00'];
        
        times.forEach((time, index) => {
          const [hours, minutes] = time.split(':');
          const scheduledAt = new Date(date);
          scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          calendar.push({
            date: date.toISOString().split('T')[0],
            time,
            scheduled_at: scheduledAt,
            platform,
            theme: themes[index % themes.length],
            content_type: this.selectContentType(strategy.content_mix),
            status: 'planned'
          });
        });
      }
    }

    return calendar;
  },

  /**
   * SELECT CONTENT TYPE based on strategy mix
   */
  selectContentType(contentMix = {}) {
    const rand = Math.random() * 100;
    let cumulative = 0;

    for (const [type, percentage] of Object.entries(contentMix)) {
      cumulative += percentage;
      if (rand <= cumulative) return type;
    }

    return 'image';
  },

  /**
   * PRE-GENERATE CONTENT
   * Creates actual content pieces for upcoming schedule
   */
  async pregenerateContent(campaign, calendarItems) {
    for (const item of calendarItems) {
      try {
        // Generate content based on theme and type
        const content = await this.generateAutopilotContent(campaign, item);

        // Create post
        const { rows: postRows } = await query(
          `INSERT INTO posts
             (user_id, campaign_id, title, content_text, platform_data, 
              status, ai_generated, ai_prompt, tone, language, content_type)
           VALUES ($1, $2, $3, $4, $5, 'scheduled', true, $6, $7, $8, $9)
           RETURNING *`,
          [
            campaign.user_id,
            campaign.id,
            item.theme,
            content.caption || content.text,
            JSON.stringify(content.platform_data),
            item.theme,
            campaign.tone,
            campaign.language,
            item.content_type
          ]
        );

        // Schedule publishing
        await PublishingService.schedulePost(
          postRows[0].id,
          campaign.social_account_ids.filter(id => {
            // Only schedule for matching platform accounts
            return true; // TODO: Filter by platform
          }),
          item.scheduled_at
        );

        logger.info(`Pre-generated content for ${item.date} ${item.time} - ${item.platform}`);
      } catch (err) {
        logger.error(`Failed to pre-generate content for ${item.date}:`, err);
      }
    }
  },

  /**
   * GENERATE AUTOPILOT CONTENT
   * AI creates complete content piece (text + media)
   */
  async generateAutopilotContent(campaign, calendarItem) {
    const { theme, platform, content_type } = calendarItem;

    // Generate platform-specific content
    const prompt = `Create ${content_type} content for ${platform} about: ${theme}

Business: ${campaign.business_name || campaign.name}
Audience: ${campaign.target_audience}
Tone: ${campaign.tone}
Language: ${campaign.language}

Return JSON with platform-optimized content:
{
  "caption": "Engaging caption with emojis",
  "hashtags": ["tag1", "tag2", "tag3"],
  "cta": "Clear call-to-action",
  "${platform}": {
    "text": "Platform-specific text",
    "optimal_length": "appropriate length",
    "hooks": "Attention-grabbing opening"
  }
}`;

    try {
      const textContent = await ModelRouter.text(
        prompt,
        'You are an expert social media content creator.',
        { json: true, maxTokens: 1000 }
      );

      const parsed = JSON.parse(textContent);

      // Generate media based on content_type
      let mediaUrl = null;
      if (content_type === 'image') {
        const imageResult = await ModelRouter.image(
          `Professional ${theme} visual for ${campaign.business_name}. ${campaign.brand_voice}`,
          { size: '1024x1024' }
        );
        mediaUrl = imageResult.url;
      } else if (content_type === 'video') {
        const videoResult = await ModelRouter.video(
          `${theme} - ${parsed.caption}`,
          { duration: 15, aspectRatio: platform === 'tiktok' ? '9:16' : '16:9' }
        );
        mediaUrl = videoResult.url || null;
      }

      return {
        caption: parsed.caption,
        hashtags: parsed.hashtags,
        cta: parsed.cta,
        media_url: mediaUrl,
        platform_data: {
          [platform]: {
            text: parsed[platform]?.text || parsed.caption,
            media_url: mediaUrl,
            hashtags: parsed.hashtags
          }
        }
      };
    } catch (err) {
      logger.error('Autopilot content generation error:', err);
      return {
        caption: `${theme} - ${campaign.business_name}`,
        hashtags: [],
        cta: 'Learn more!',
        platform_data: {}
      };
    }
  },

  /**
   * PAUSE AUTOPILOT
   */
  async pauseAutopilot(campaignId) {
    await query(
      'UPDATE campaigns SET autopilot_enabled = false WHERE id = $1',
      [campaignId]
    );
    logger.info(`⏸️  Autopilot paused for campaign ${campaignId}`);
  },

  /**
   * RESUME AUTOPILOT
   */
  async resumeAutopilot(campaignId) {
    await query(
      'UPDATE campaigns SET autopilot_enabled = true WHERE id = $1',
      [campaignId]
    );
    logger.info(`▶️  Autopilot resumed for campaign ${campaignId}`);
  },

  /**
   * OPTIMIZE BASED ON PERFORMANCE
   * AI learns from analytics and adjusts strategy
   */
  async optimizeCampaign(campaignId) {
    try {
      const stats = await this.getCampaignStats(campaignId);
      const { rows: campaign } = await query(
        'SELECT * FROM campaigns WHERE id = $1',
        [campaignId]
      );

      if (!campaign[0]) return;

      // Analyze performance and generate recommendations
      const recommendations = await this.generateOptimizationRecommendations(
        campaign[0],
        stats
      );

      // Save recommendations
      await query(
        `INSERT INTO campaign_insights (campaign_id, insights, recommendations, metrics)
         VALUES ($1, $2, $3, $4)`,
        [
          campaignId,
          JSON.stringify({ analysis: 'Performance analysis' }),
          JSON.stringify(recommendations),
          JSON.stringify(stats)
        ]
      );

      logger.info(`📊 Campaign ${campaignId} optimized - ${recommendations.length} recommendations`);

      return recommendations;
    } catch (err) {
      logger.error('Campaign optimization error:', err);
      return [];
    }
  },

  /**
   * GENERATE AI OPTIMIZATION RECOMMENDATIONS
   */
  async generateOptimizationRecommendations(campaign, stats) {
    const prompt = `Analyze this campaign performance and provide optimization recommendations:

Campaign: ${campaign.name}
Posts Published: ${stats.total_posts}
Total Views: ${stats.total_views}
Total Likes: ${stats.total_likes}
Avg Engagement: ${stats.avg_engagement}%

Provide actionable recommendations to improve performance.

Return JSON array:
[
  {
    "type": "content_type|timing|platform|tone",
    "priority": "high|medium|low",
    "recommendation": "Specific action to take",
    "expected_impact": "What improvement to expect"
  }
]`;

    try {
      const response = await ModelRouter.text(
        prompt,
        'You are a marketing analytics expert.',
        { json: true, maxTokens: 1500 }
      );
      return JSON.parse(response);
    } catch (err) {
      logger.error('Recommendation generation error:', err);
      return [];
    }
  }
};

module.exports = CampaignAutomation;
