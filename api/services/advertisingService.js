/**
 * Advertising Service
 * Manages ad campaigns, ad sets, advertisements, A/B testing, budget control
 * Integrates with Meta Ads, TikTok Ads, Google Ads, LinkedIn Ads
 */

const db = require('../database');
const logger = require('../utils/logger');

class AdvertisingService {
  
  // ─── CAMPAIGNS ─────────────────────────────────────────────

  /**
   * Create a new ad campaign
   */
  async createCampaign(userId, campaignData) {
    const {
      platform,
      name,
      objective,
      budgetType,
      budgetAmount,
      currency = 'USD',
      startDate,
      endDate,
      targeting = {}
    } = campaignData;

    const result = await db.query(
      `INSERT INTO ad_campaigns (
        user_id, platform, name, objective, budget_type, budget_amount, currency,
        start_date, end_date, target_locations, target_age_min, target_age_max,
        target_genders, target_interests, target_behaviors, target_languages, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        userId, platform, name, objective, budgetType, budgetAmount, currency,
        startDate, endDate,
        targeting.locations || [],
        targeting.ageMin,
        targeting.ageMax,
        targeting.genders || [],
        targeting.interests || [],
        targeting.behaviors || [],
        targeting.languages || [],
        'draft'
      ]
    );

    logger.info(`Ad campaign created: ${result.rows[0].id}`);
    return result.rows[0];
  }

  /**
   * Get all campaigns for a user
   */
  async getCampaigns(userId, filters = {}) {
    let query = `
      SELECT ac.*, 
             COUNT(DISTINCT ads.id) as ad_sets_count,
             COUNT(DISTINCT a.id) as ads_count
      FROM ad_campaigns ac
      LEFT JOIN ad_sets ads ON ads.ad_campaign_id = ac.id
      LEFT JOIN advertisements a ON a.ad_set_id = ads.id
      WHERE ac.user_id = $1
    `;
    
    const params = [userId];
    let paramIndex = 2;

    if (filters.platform) {
      query += ` AND ac.platform = $${paramIndex}`;
      params.push(filters.platform);
      paramIndex++;
    }

    if (filters.status) {
      query += ` AND ac.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    query += ` GROUP BY ac.id ORDER BY ac.created_at DESC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(userId, campaignId) {
    const result = await db.query(
      `SELECT ac.*,
              COUNT(DISTINCT ads.id) as ad_sets_count,
              COUNT(DISTINCT a.id) as ads_count
       FROM ad_campaigns ac
       LEFT JOIN ad_sets ads ON ads.ad_campaign_id = ac.id
       LEFT JOIN advertisements a ON a.ad_set_id = ads.id
       WHERE ac.id = $1 AND ac.user_id = $2
       GROUP BY ac.id`,
      [campaignId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Campaign not found');
    }

    return result.rows[0];
  }

  /**
   * Update campaign
   */
  async updateCampaign(userId, campaignId, updates) {
    const setClauses = [];
    const values = [campaignId, userId];
    let paramIndex = 3;

    const allowedFields = [
      'name', 'status', 'budget_type', 'budget_amount', 'start_date', 'end_date',
      'target_locations', 'target_age_min', 'target_age_max', 'target_genders',
      'target_interests', 'target_behaviors', 'target_languages'
    ];

    Object.keys(updates).forEach(key => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        setClauses.push(`${snakeKey} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (setClauses.length === 0) {
      throw new Error('No valid fields to update');
    }

    setClauses.push(`updated_at = NOW()`);

    const query = `
      UPDATE ad_campaigns 
      SET ${setClauses.join(', ')}
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete campaign (and cascade to ad sets and ads)
   */
  async deleteCampaign(userId, campaignId) {
    const result = await db.query(
      `DELETE FROM ad_campaigns WHERE id = $1 AND user_id = $2 RETURNING *`,
      [campaignId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Campaign not found');
    }

    logger.info(`Ad campaign deleted: ${campaignId}`);
    return { success: true };
  }

  // ─── AD SETS ───────────────────────────────────────────────

  /**
   * Create ad set
   */
  async createAdSet(userId, adSetData) {
    // Verify campaign ownership
    const campaign = await this.getCampaignById(userId, adSetData.campaignId);
    
    const result = await db.query(
      `INSERT INTO ad_sets (
        ad_campaign_id, name, status, budget_type, budget_amount,
        start_time, end_time, targeting, optimization_goal, bid_strategy, bid_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        adSetData.campaignId,
        adSetData.name,
        adSetData.status || 'active',
        adSetData.budgetType,
        adSetData.budgetAmount,
        adSetData.startTime,
        adSetData.endTime,
        JSON.stringify(adSetData.targeting || {}),
        adSetData.optimizationGoal,
        adSetData.bidStrategy,
        adSetData.bidAmount
      ]
    );

    return result.rows[0];
  }

  /**
   * Get ad sets for a campaign
   */
  async getAdSets(userId, campaignId) {
    // Verify campaign ownership
    await this.getCampaignById(userId, campaignId);

    const result = await db.query(
      `SELECT ads.*,
              COUNT(a.id) as ads_count
       FROM ad_sets ads
       LEFT JOIN advertisements a ON a.ad_set_id = ads.id
       WHERE ads.ad_campaign_id = $1
       GROUP BY ads.id
       ORDER BY ads.created_at DESC`,
      [campaignId]
    );

    return result.rows;
  }

  /**
   * Update ad set
   */
  async updateAdSet(userId, adSetId, updates) {
    const setClauses = [];
    const values = [adSetId];
    let paramIndex = 2;

    const allowedFields = [
      'name', 'status', 'budget_type', 'budget_amount', 'start_time', 'end_time',
      'optimization_goal', 'bid_strategy', 'bid_amount'
    ];

    Object.keys(updates).forEach(key => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        setClauses.push(`${snakeKey} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (updates.targeting) {
      setClauses.push(`targeting = $${paramIndex}`);
      values.push(JSON.stringify(updates.targeting));
      paramIndex++;
    }

    setClauses.push(`updated_at = NOW()`);

    const query = `
      UPDATE ad_sets 
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete ad set
   */
  async deleteAdSet(userId, adSetId) {
    // Verify ownership through campaign
    const adSet = await db.query(
      `SELECT ads.*, ac.user_id 
       FROM ad_sets ads
       JOIN ad_campaigns ac ON ac.id = ads.ad_campaign_id
       WHERE ads.id = $1`,
      [adSetId]
    );

    if (adSet.rows.length === 0 || adSet.rows[0].user_id !== userId) {
      throw new Error('Ad set not found');
    }

    await db.query(`DELETE FROM ad_sets WHERE id = $1`, [adSetId]);
    return { success: true };
  }

  // ─── ADVERTISEMENTS ────────────────────────────────────────

  /**
   * Create advertisement
   */
  async createAdvertisement(userId, adData) {
    const result = await db.query(
      `INSERT INTO advertisements (
        ad_set_id, name, format, status, headline, primary_text, description,
        cta_type, cta_url, media_ids, thumbnail_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        adData.adSetId,
        adData.name,
        adData.format,
        adData.status || 'active',
        adData.headline,
        adData.primaryText,
        adData.description,
        adData.ctaType,
        adData.ctaUrl,
        adData.mediaIds || [],
        adData.thumbnailUrl
      ]
    );

    return result.rows[0];
  }

  /**
   * Get advertisements for an ad set
   */
  async getAdvertisements(userId, adSetId) {
    const result = await db.query(
      `SELECT a.*
       FROM advertisements a
       JOIN ad_sets ads ON ads.id = a.ad_set_id
       JOIN ad_campaigns ac ON ac.id = ads.ad_campaign_id
       WHERE a.ad_set_id = $1 AND ac.user_id = $2
       ORDER BY a.created_at DESC`,
      [adSetId, userId]
    );

    return result.rows;
  }

  /**
   * Get advertisement by ID
   */
  async getAdvertisementById(userId, adId) {
    const result = await db.query(
      `SELECT a.*
       FROM advertisements a
       JOIN ad_sets ads ON ads.id = a.ad_set_id
       JOIN ad_campaigns ac ON ac.id = ads.ad_campaign_id
       WHERE a.id = $1 AND ac.user_id = $2`,
      [adId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Advertisement not found');
    }

    return result.rows[0];
  }

  /**
   * Update advertisement
   */
  async updateAdvertisement(userId, adId, updates) {
    const setClauses = [];
    const values = [adId];
    let paramIndex = 2;

    const allowedFields = [
      'name', 'status', 'headline', 'primary_text', 'description',
      'cta_type', 'cta_url', 'media_ids', 'thumbnail_url'
    ];

    Object.keys(updates).forEach(key => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        setClauses.push(`${snakeKey} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    setClauses.push(`updated_at = NOW()`);

    const query = `
      UPDATE advertisements 
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete advertisement
   */
  async deleteAdvertisement(userId, adId) {
    await this.getAdvertisementById(userId, adId); // Verify ownership

    await db.query(`DELETE FROM advertisements WHERE id = $1`, [adId]);
    return { success: true };
  }

  // ─── A/B TESTING ───────────────────────────────────────────

  /**
   * Create A/B test variants
   */
  async createABTest(userId, testData) {
    const { parentAdId, variants } = testData;

    // Verify parent ad ownership
    await this.getAdvertisementById(userId, parentAdId);

    // Create variants
    const variantAds = [];
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      const result = await db.query(
        `INSERT INTO advertisements (
          ad_set_id, name, format, status, headline, primary_text, description,
          cta_type, cta_url, media_ids, thumbnail_url, is_variant, parent_ad_id, variant_name
        ) 
        SELECT ad_set_id, $1, format, 'active', $2, $3, $4, $5, $6, $7, $8, TRUE, $9, $10
        FROM advertisements WHERE id = $9
        RETURNING *`,
        [
          variant.name,
          variant.headline,
          variant.primaryText,
          variant.description,
          variant.ctaType,
          variant.ctaUrl,
          variant.mediaIds || [],
          variant.thumbnailUrl,
          parentAdId,
          variant.variantName || String.fromCharCode(65 + i) // A, B, C...
        ]
      );
      variantAds.push(result.rows[0]);
    }

    // Create test result record
    const testResult = await db.query(
      `INSERT INTO ab_test_results (parent_ad_id, test_name, variants)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [
        parentAdId,
        testData.testName || 'A/B Test',
        JSON.stringify(variantAds.map(v => ({
          ad_id: v.id,
          variant_name: v.variant_name,
          impressions: 0,
          clicks: 0,
          conversions: 0
        })))
      ]
    );

    return {
      testId: testResult.rows[0].id,
      variants: variantAds
    };
  }

  /**
   * Get A/B test results
   */
  async getABTestResults(userId, parentAdId) {
    await this.getAdvertisementById(userId, parentAdId);

    const result = await db.query(
      `SELECT abt.*,
              json_agg(
                json_build_object(
                  'id', a.id,
                  'variant_name', a.variant_name,
                  'impressions', a.impressions,
                  'clicks', a.clicks,
                  'conversions', a.conversions,
                  'ctr', a.ctr,
                  'cpc', a.cpc
                )
              ) as variant_data
       FROM ab_test_results abt
       LEFT JOIN advertisements a ON a.parent_ad_id = abt.parent_ad_id AND a.is_variant = TRUE
       WHERE abt.parent_ad_id = $1
       GROUP BY abt.id`,
      [parentAdId]
    );

    return result.rows[0] || null;
  }

  /**
   * Declare winner of A/B test
   */
  async declareABTestWinner(userId, testId, winningAdId) {
    const result = await db.query(
      `UPDATE ab_test_results
       SET winning_variant = $1, status = 'completed', completed_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [winningAdId, testId]
    );

    // Pause losing variants
    await db.query(
      `UPDATE advertisements
       SET status = 'paused'
       WHERE parent_ad_id = (SELECT parent_ad_id FROM ab_test_results WHERE id = $1)
         AND id != $2
         AND is_variant = TRUE`,
      [testId, winningAdId]
    );

    logger.info(`A/B test winner declared: ${winningAdId}`);
    return result.rows[0];
  }

  // ─── BUDGET MANAGEMENT ─────────────────────────────────────

  /**
   * Set monthly budget
   */
  async setMonthlyBudget(userId, budgetData) {
    const { month, totalBudget, platformBudgets } = budgetData;

    const result = await db.query(
      `INSERT INTO monthly_ad_budgets (user_id, month, total_budget, platform_budgets, remaining_amount)
       VALUES ($1, $2, $3, $4, $3)
       ON CONFLICT (user_id, month) 
       DO UPDATE SET 
         total_budget = $3,
         platform_budgets = $4,
         remaining_amount = $3 - EXCLUDED.spent_amount,
         updated_at = NOW()
       RETURNING *`,
      [userId, month, totalBudget, JSON.stringify(platformBudgets)]
    );

    return result.rows[0];
  }

  /**
   * Get monthly budget
   */
  async getMonthlyBudget(userId, month) {
    const result = await db.query(
      `SELECT * FROM monthly_ad_budgets
       WHERE user_id = $1 AND month = $2`,
      [userId, month]
    );

    return result.rows[0] || null;
  }

  /**
   * Get budget alerts
   */
  async getBudgetAlerts(userId, unreadOnly = false) {
    let query = `
      SELECT ba.*, ac.name as campaign_name
      FROM budget_alerts ba
      JOIN ad_campaigns ac ON ac.id = ba.ad_campaign_id
      WHERE ba.user_id = $1
    `;

    if (unreadOnly) {
      query += ` AND ba.is_read = FALSE`;
    }

    query += ` ORDER BY ba.triggered_at DESC`;

    const result = await db.query(query, [userId]);
    return result.rows;
  }

  /**
   * Mark budget alert as read
   */
  async markAlertAsRead(userId, alertId) {
    await db.query(
      `UPDATE budget_alerts SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
      [alertId, userId]
    );
    return { success: true };
  }

  /**
   * Check and create budget alerts
   */
  async checkBudgetAlerts(userId, campaignId) {
    const campaign = await this.getCampaignById(userId, campaignId);
    
    if (!campaign.budget_amount) return;

    const spentPercentage = (campaign.spent_amount / campaign.budget_amount) * 100;

    // Alert at 85% and 100%
    if (spentPercentage >= 85) {
      const alertType = spentPercentage >= 100 ? 'budget_100_percent' : 'budget_85_percent';
      
      // Check if alert already exists
      const existing = await db.query(
        `SELECT id FROM budget_alerts 
         WHERE user_id = $1 AND ad_campaign_id = $2 AND alert_type = $3`,
        [userId, campaignId, alertType]
      );

      if (existing.rows.length === 0) {
        await db.query(
          `INSERT INTO budget_alerts (user_id, ad_campaign_id, alert_type, threshold, current_value, message)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            userId,
            campaignId,
            alertType,
            campaign.budget_amount,
            campaign.spent_amount,
            `Campaign "${campaign.name}" has reached ${Math.round(spentPercentage)}% of its budget.`
          ]
        );

        logger.warn(`Budget alert triggered for campaign ${campaignId}: ${spentPercentage}%`);
      }
    }
  }

  // ─── ANALYTICS ─────────────────────────────────────────────

  /**
   * Get advertising overview stats
   */
  async getOverviewStats(userId) {
    const result = await db.query(
      `SELECT 
         COUNT(DISTINCT ac.id) as active_campaigns,
         SUM(ac.spent_amount) as total_spent,
         SUM(ac.impressions) as total_impressions,
         SUM(ac.clicks) as total_clicks,
         SUM(ac.conversions) as total_conversions,
         AVG(ac.ctr) as avg_ctr,
         AVG(ac.roas) as avg_roas
       FROM ad_campaigns ac
       WHERE ac.user_id = $1 AND ac.status = 'active'`,
      [userId]
    );

    return result.rows[0];
  }

  /**
   * Get platform breakdown
   */
  async getPlatformBreakdown(userId) {
    const result = await db.query(
      `SELECT 
         platform,
         COUNT(*) as campaign_count,
         SUM(spent_amount) as spent,
         SUM(impressions) as impressions,
         SUM(clicks) as clicks,
         SUM(conversions) as conversions,
         AVG(ctr) as ctr,
         AVG(roas) as roas
       FROM ad_campaigns
       WHERE user_id = $1
       GROUP BY platform
       ORDER BY spent DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Get top performing ads
   */
  async getTopPerformingAds(userId, limit = 10) {
    const result = await db.query(
      `SELECT a.*, 
              ac.name as campaign_name,
              ac.platform
       FROM advertisements a
       JOIN ad_sets ads ON ads.id = a.ad_set_id
       JOIN ad_campaigns ac ON ac.id = ads.ad_campaign_id
       WHERE ac.user_id = $1 AND a.status = 'active'
       ORDER BY a.conversions DESC, a.ctr DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  // ─── PLATFORM INTEGRATIONS ─────────────────────────────────

  /**
   * Sync campaign with platform API
   * (Placeholder for actual API integration)
   */
  async syncCampaignWithPlatform(userId, campaignId) {
    const campaign = await this.getCampaignById(userId, campaignId);
    
    logger.info(`Syncing campaign ${campaignId} with ${campaign.platform}`);

    // TODO: Implement actual API calls based on platform
    switch (campaign.platform) {
      case 'meta_ads':
        // await this.syncWithMetaAds(campaign);
        break;
      case 'tiktok_ads':
        // await this.syncWithTikTokAds(campaign);
        break;
      case 'google_ads':
        // await this.syncWithGoogleAds(campaign);
        break;
      case 'linkedin_ads':
        // await this.syncWithLinkedInAds(campaign);
        break;
    }

    await db.query(
      `UPDATE ad_campaigns SET last_synced_at = NOW() WHERE id = $1`,
      [campaignId]
    );

    return { success: true, syncedAt: new Date() };
  }

  /**
   * Save ad account credentials
   */
  async saveAdAccountCredentials(userId, credentialsData) {
    const { platform, accountId, accountName, accessToken, refreshToken, businessId } = credentialsData;

    const result = await db.query(
      `INSERT INTO ad_account_credentials (
        user_id, platform, account_id, account_name, access_token, refresh_token, business_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id, platform, account_id)
      DO UPDATE SET
        account_name = $4,
        access_token = $5,
        refresh_token = $6,
        business_id = $7,
        updated_at = NOW()
      RETURNING *`,
      [userId, platform, accountId, accountName, accessToken, refreshToken, businessId]
    );

    logger.info(`Ad account credentials saved for ${platform}`);
    return result.rows[0];
  }
}

module.exports = new AdvertisingService();
