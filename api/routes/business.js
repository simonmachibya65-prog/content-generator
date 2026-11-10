const express = require('express');
const { authenticate } = require('../middleware/auth');
const { query } = require('../database');
const AIService = require('../services/aiService');
const logger = require('../utils/logger');

const router = express.Router();

// ─── GET /api/business/profile ────────────────────────────────
router.get('/profile', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM business_profiles WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );
    res.json({ profile: rows[0] || null });
  } catch (err) {
    logger.error('Get business profile error:', err);
    res.status(500).json({ error: 'Failed to fetch business profile' });
  }
});

// ─── POST /api/business/profile ───────────────────────────────
router.post('/profile', authenticate, async (req, res) => {
  try {
    const {
      business_name, industry, products, services,
      target_audience, target_location, website,
      marketing_goals, preferred_languages,
      brand_logo_url, brand_colors, brand_fonts,
      contact_info, promotional_offers, business_description
    } = req.body;

    if (!business_name || !industry) {
      return res.status(400).json({ error: 'Business name and industry are required' });
    }

    // Check if profile exists
    const { rows: existing } = await query(
      'SELECT id FROM business_profiles WHERE user_id = $1',
      [req.user.id]
    );

    let profile;
    if (existing[0]) {
      // Update
      const { rows } = await query(
        `UPDATE business_profiles SET
          business_name=$1, industry=$2, products=$3, services=$4,
          target_audience=$5, target_location=$6, website=$7,
          marketing_goals=$8, preferred_languages=$9,
          brand_logo_url=$10, brand_colors=$11, brand_fonts=$12,
          contact_info=$13, promotional_offers=$14, business_description=$15,
          updated_at=NOW()
        WHERE user_id=$16 RETURNING *`,
        [
          business_name, industry, products, services,
          JSON.stringify(target_audience || {}), target_location, website,
          JSON.stringify(marketing_goals || []), preferred_languages || ['en'],
          brand_logo_url, JSON.stringify(brand_colors || {}), JSON.stringify(brand_fonts || {}),
          JSON.stringify(contact_info || {}), promotional_offers, business_description,
          req.user.id
        ]
      );
      profile = rows[0];
    } else {
      // Insert
      const { rows } = await query(
        `INSERT INTO business_profiles (
          user_id, business_name, industry, products, services,
          target_audience, target_location, website,
          marketing_goals, preferred_languages,
          brand_logo_url, brand_colors, brand_fonts,
          contact_info, promotional_offers, business_description
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        RETURNING *`,
        [
          req.user.id, business_name, industry, products, services,
          JSON.stringify(target_audience || {}), target_location, website,
          JSON.stringify(marketing_goals || []), preferred_languages || ['en'],
          brand_logo_url, JSON.stringify(brand_colors || {}), JSON.stringify(brand_fonts || {}),
          JSON.stringify(contact_info || {}), promotional_offers, business_description
        ]
      );
      profile = rows[0];
    }

    // Mark user as having completed business setup
    await query(
      'UPDATE users SET has_business_profile = TRUE WHERE id = $1',
      [req.user.id]
    );

    logger.info('Business profile saved', { userId: req.user.id });
    res.json({ profile, message: 'Business profile saved' });
  } catch (err) {
    logger.error('Save business profile error:', err);
    res.status(500).json({ error: 'Failed to save business profile' });
  }
});

// ─── GET /api/business/brand-intelligence ─────────────────────
router.get('/brand-intelligence', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT bi.* FROM brand_intelligence bi
       JOIN business_profiles bp ON bi.business_profile_id = bp.id
       WHERE bp.user_id = $1
       ORDER BY bi.generated_at DESC LIMIT 1`,
      [req.user.id]
    );
    res.json({ intelligence: rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch brand intelligence' });
  }
});

// ─── POST /api/business/brand-intelligence ────────────────────
// Generate AI brand intelligence from business profile
router.post('/brand-intelligence', authenticate, async (req, res) => {
  try {
    // Get business profile
    const { rows: profileRows } = await query(
      'SELECT * FROM business_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (!profileRows[0]) {
      return res.status(400).json({ error: 'Please complete your business profile first' });
    }

    const profile = profileRows[0];

    // Generate brand intelligence via AI
    const intelligence = await AIService.generateBrandIntelligence(profile);

    // Save to database
    const { rows } = await query(
      `INSERT INTO brand_intelligence (
        business_profile_id, brand_identity, brand_voice, tone_guidelines,
        content_themes, target_personas, visual_guidelines,
        marketing_strategy, content_pillars, posting_strategy,
        ai_model, generated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
      ON CONFLICT (business_profile_id)
      DO UPDATE SET
        brand_identity=$2, brand_voice=$3, tone_guidelines=$4,
        content_themes=$5, target_personas=$6, visual_guidelines=$7,
        marketing_strategy=$8, content_pillars=$9, posting_strategy=$10,
        ai_model=$11, generated_at=NOW()
      RETURNING *`,
      [
        profile.id,
        intelligence.brand_identity,
        intelligence.brand_voice,
        JSON.stringify(intelligence.tone_guidelines || {}),
        JSON.stringify(intelligence.content_themes || []),
        JSON.stringify(intelligence.target_personas || []),
        JSON.stringify(intelligence.visual_guidelines || {}),
        intelligence.marketing_strategy,
        JSON.stringify(intelligence.content_pillars || []),
        JSON.stringify(intelligence.posting_strategy || {}),
        'gpt-4o'
      ]
    );

    // Deduct AI credits
    await query(
      'UPDATE users SET ai_credits_used = ai_credits_used + 5 WHERE id = $1',
      [req.user.id]
    );

    logger.info('Brand intelligence generated', { userId: req.user.id });
    res.json({ intelligence: rows[0] });
  } catch (err) {
    logger.error('Brand intelligence error:', err);
    res.status(500).json({ error: 'Failed to generate brand intelligence' });
  }
});

// ─── POST /api/business/marketing-strategy ────────────────────
// Generate a complete marketing strategy
router.post('/marketing-strategy', authenticate, async (req, res) => {
  try {
    const { months = 1, focus_platforms, campaign_goals } = req.body;

    // Get business profile + brand intelligence
    const { rows: profileRows } = await query(
      `SELECT bp.*, bi.brand_voice, bi.content_themes, bi.target_personas
       FROM business_profiles bp
       LEFT JOIN brand_intelligence bi ON bi.business_profile_id = bp.id
       WHERE bp.user_id = $1`,
      [req.user.id]
    );

    if (!profileRows[0]) {
      return res.status(400).json({ error: 'Please complete your business profile first' });
    }

    const profile = profileRows[0];

    // Get connected platforms
    const { rows: accountRows } = await query(
      'SELECT DISTINCT platform_name FROM social_accounts WHERE user_id = $1 AND status = $2',
      [req.user.id, 'connected']
    );
    const connectedPlatforms = accountRows.map(r => r.platform_name);

    const strategy = await AIService.generateMarketingStrategy({
      profile,
      months,
      connectedPlatforms: focus_platforms || connectedPlatforms,
      campaignGoals: campaign_goals
    });

    // Deduct 5 credits for strategy generation
    await query(
      'UPDATE users SET ai_credits_used = ai_credits_used + 5 WHERE id = $1',
      [req.user.id]
    );

    // Save strategy
    const { rows } = await query(
      `INSERT INTO marketing_strategies (user_id, business_profile_id, strategy_data, months, status, generated_at)
       VALUES ($1, $2, $3, $4, 'draft', NOW())
       RETURNING *`,
      [req.user.id, profileRows[0].id, JSON.stringify(strategy), months]
    );

    res.json({ strategy: rows[0], content: strategy });
  } catch (err) {
    logger.error('Marketing strategy error:', err);
    res.status(500).json({ error: 'Failed to generate marketing strategy' });
  }
});

// ─── GET /api/business/marketing-strategy ─────────────────────
router.get('/marketing-strategy', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT ms.* FROM marketing_strategies ms
       WHERE ms.user_id = $1
       ORDER BY ms.generated_at DESC LIMIT 5`,
      [req.user.id]
    );
    res.json({ strategies: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch strategies' });
  }
});

// ─── POST /api/business/ai-chat ───────────────────────────────
router.post('/ai-chat', authenticate, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages?.length) return res.status(400).json({ error: 'Messages required' });

    // Get business context
    const { rows: profileRows } = await query(
      'SELECT business_name, industry, products, marketing_goals FROM business_profiles WHERE user_id = $1',
      [req.user.id]
    );

    const reply = await AIService.marketingChat({
      messages,
      businessContext: profileRows[0] || null
    });

    res.json({ reply });
  } catch (err) {
    logger.error('AI chat error:', err);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

module.exports = router;
