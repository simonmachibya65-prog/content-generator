/**
 * Advertising Routes
 * Endpoints for ad campaigns, ad sets, advertisements, A/B testing, budget management
 */

const express = require('express');
const router = express.Router();
const advertisingService = require('../services/advertisingService');
const { authenticate } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// ─── CAMPAIGNS ─────────────────────────────────────────────────

/**
 * GET /api/advertising/campaigns
 * Get all campaigns with filters
 */
router.get('/campaigns', async (req, res) => {
  try {
    const { platform, status } = req.query;
    const campaigns = await advertisingService.getCampaigns(req.user.id, {
      platform,
      status
    });
    res.json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/advertising/campaigns
 * Create a new campaign
 */
router.post('/campaigns', async (req, res) => {
  try {
    const campaign = await advertisingService.createCampaign(req.user.id, req.body);
    res.status(201).json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/advertising/campaigns/:id
 * Get campaign by ID
 */
router.get('/campaigns/:id', async (req, res) => {
  try {
    const campaign = await advertisingService.getCampaignById(req.user.id, req.params.id);
    res.json({ success: true, campaign });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/advertising/campaigns/:id
 * Update campaign
 */
router.put('/campaigns/:id', async (req, res) => {
  try {
    const campaign = await advertisingService.updateCampaign(
      req.user.id,
      req.params.id,
      req.body
    );
    res.json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/advertising/campaigns/:id
 * Delete campaign
 */
router.delete('/campaigns/:id', async (req, res) => {
  try {
    await advertisingService.deleteCampaign(req.user.id, req.params.id);
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/advertising/campaigns/:id/sync
 * Sync campaign with platform API
 */
router.post('/campaigns/:id/sync', async (req, res) => {
  try {
    const result = await advertisingService.syncCampaignWithPlatform(
      req.user.id,
      req.params.id
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── AD SETS ───────────────────────────────────────────────────

/**
 * GET /api/advertising/campaigns/:campaignId/ad-sets
 * Get all ad sets for a campaign
 */
router.get('/campaigns/:campaignId/ad-sets', async (req, res) => {
  try {
    const adSets = await advertisingService.getAdSets(req.user.id, req.params.campaignId);
    res.json({ success: true, adSets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/advertising/ad-sets
 * Create a new ad set
 */
router.post('/ad-sets', async (req, res) => {
  try {
    const adSet = await advertisingService.createAdSet(req.user.id, req.body);
    res.status(201).json({ success: true, adSet });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/advertising/ad-sets/:id
 * Update ad set
 */
router.put('/ad-sets/:id', async (req, res) => {
  try {
    const adSet = await advertisingService.updateAdSet(req.user.id, req.params.id, req.body);
    res.json({ success: true, adSet });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/advertising/ad-sets/:id
 * Delete ad set
 */
router.delete('/ad-sets/:id', async (req, res) => {
  try {
    await advertisingService.deleteAdSet(req.user.id, req.params.id);
    res.json({ success: true, message: 'Ad set deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── ADVERTISEMENTS ────────────────────────────────────────────

/**
 * GET /api/advertising/ad-sets/:adSetId/ads
 * Get all ads for an ad set
 */
router.get('/ad-sets/:adSetId/ads', async (req, res) => {
  try {
    const ads = await advertisingService.getAdvertisements(req.user.id, req.params.adSetId);
    res.json({ success: true, ads });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/advertising/ads
 * Create a new advertisement
 */
router.post('/ads', async (req, res) => {
  try {
    const ad = await advertisingService.createAdvertisement(req.user.id, req.body);
    res.status(201).json({ success: true, ad });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/advertising/ads/:id
 * Get advertisement by ID
 */
router.get('/ads/:id', async (req, res) => {
  try {
    const ad = await advertisingService.getAdvertisementById(req.user.id, req.params.id);
    res.json({ success: true, ad });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/advertising/ads/:id
 * Update advertisement
 */
router.put('/ads/:id', async (req, res) => {
  try {
    const ad = await advertisingService.updateAdvertisement(
      req.user.id,
      req.params.id,
      req.body
    );
    res.json({ success: true, ad });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/advertising/ads/:id
 * Delete advertisement
 */
router.delete('/ads/:id', async (req, res) => {
  try {
    await advertisingService.deleteAdvertisement(req.user.id, req.params.id);
    res.json({ success: true, message: 'Advertisement deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── A/B TESTING ───────────────────────────────────────────────

/**
 * POST /api/advertising/ab-tests
 * Create A/B test with variants
 */
router.post('/ab-tests', async (req, res) => {
  try {
    const result = await advertisingService.createABTest(req.user.id, req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/advertising/ab-tests/:parentAdId
 * Get A/B test results
 */
router.get('/ab-tests/:parentAdId', async (req, res) => {
  try {
    const results = await advertisingService.getABTestResults(req.user.id, req.params.parentAdId);
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/advertising/ab-tests/:testId/winner
 * Declare A/B test winner
 */
router.post('/ab-tests/:testId/winner', async (req, res) => {
  try {
    const { winningAdId } = req.body;
    const result = await advertisingService.declareABTestWinner(
      req.user.id,
      req.params.testId,
      winningAdId
    );
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── BUDGET MANAGEMENT ─────────────────────────────────────────

/**
 * GET /api/advertising/budget/:month
 * Get monthly budget
 */
router.get('/budget/:month', async (req, res) => {
  try {
    const budget = await advertisingService.getMonthlyBudget(req.user.id, req.params.month);
    res.json({ success: true, budget });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/advertising/budget
 * Set monthly budget
 */
router.post('/budget', async (req, res) => {
  try {
    const budget = await advertisingService.setMonthlyBudget(req.user.id, req.body);
    res.json({ success: true, budget });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/advertising/budget-alerts
 * Get budget alerts
 */
router.get('/budget-alerts', async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    const alerts = await advertisingService.getBudgetAlerts(req.user.id, unreadOnly === 'true');
    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/advertising/budget-alerts/:id/read
 * Mark budget alert as read
 */
router.put('/budget-alerts/:id/read', async (req, res) => {
  try {
    await advertisingService.markAlertAsRead(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── ANALYTICS ─────────────────────────────────────────────────

/**
 * GET /api/advertising/overview
 * Get advertising overview stats
 */
router.get('/overview', async (req, res) => {
  try {
    const stats = await advertisingService.getOverviewStats(req.user.id);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/advertising/platform-breakdown
 * Get spending breakdown by platform
 */
router.get('/platform-breakdown', async (req, res) => {
  try {
    const breakdown = await advertisingService.getPlatformBreakdown(req.user.id);
    res.json({ success: true, breakdown });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/advertising/top-ads
 * Get top performing ads
 */
router.get('/top-ads', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const ads = await advertisingService.getTopPerformingAds(req.user.id, parseInt(limit));
    res.json({ success: true, ads });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── AD ACCOUNT CREDENTIALS ────────────────────────────────────

/**
 * POST /api/advertising/credentials
 * Save ad account credentials
 */
router.post('/credentials', async (req, res) => {
  try {
    const credentials = await advertisingService.saveAdAccountCredentials(req.user.id, req.body);
    res.json({ success: true, credentials });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
