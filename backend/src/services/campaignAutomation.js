const { query } = require('../database');
const AIService = require('./aiService');
const PublishingService = require('./publishingService');
const logger = require('../utils/logger');

/**
 * Campaign Automation Service
 * Automatically generates and publishes content for active campaigns
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
   * Pause low-performing campaigns
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
  }
};

module.exports = CampaignAutomation;
