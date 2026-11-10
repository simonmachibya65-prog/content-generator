const cron = require('node-cron');
const PublishingService = require('./publishingService');
const CampaignAutomation = require('./campaignAutomation');
const logger = require('../utils/logger');

const Scheduler = {
  jobs: [],

  init() {
    // Process publishing jobs every minute
    const publishingJob = cron.schedule('* * * * *', async () => {
      try {
        await PublishingService.processDueJobs();
      } catch (err) {
        logger.error('Scheduler: Publishing job error:', err);
      }
    });

    this.jobs.push(publishingJob);
    logger.info('Scheduler initialized - publishing jobs every minute');

    // Campaign automation - generate content for active campaigns every 6 hours
    const campaignJob = cron.schedule('0 */6 * * *', async () => {
      try {
        logger.info('Scheduler: Running campaign automation');
        await CampaignAutomation.processActiveCampaigns();
      } catch (err) {
        logger.error('Scheduler: Campaign automation error:', err);
      }
    });

    this.jobs.push(campaignJob);

    // Proactively refresh tokens expiring within 24 hours — runs at 1 AM daily
    const tokenRefreshJob = cron.schedule('0 1 * * *', async () => {
      try {
        logger.info('Scheduler: Refreshing expiring OAuth tokens');
        await PublishingService.refreshExpiringTokens();
      } catch (err) {
        logger.error('Scheduler: Token refresh error:', err);
      }
    });

    this.jobs.push(tokenRefreshJob);

    // Daily analytics sync at 2 AM
    const analyticsJob = cron.schedule('0 2 * * *', async () => {
      try {
        logger.info('Scheduler: Running daily analytics sync');
        // TODO: Implement analytics sync from each platform
      } catch (err) {
        logger.error('Scheduler: Analytics sync error:', err);
      }
    });

    this.jobs.push(analyticsJob);

    // Campaign performance monitoring - daily at 3 AM
    const monitoringJob = cron.schedule('0 3 * * *', async () => {
      try {
        logger.info('Scheduler: Monitoring campaign performance');
        await CampaignAutomation.monitorCampaignPerformance();
      } catch (err) {
        logger.error('Scheduler: Campaign monitoring error:', err);
      }
    });

    this.jobs.push(monitoringJob);

    logger.info('All schedulers initialized');
  },

  stop() {
    this.jobs.forEach(job => job.stop());
    logger.info('Scheduler stopped');
  }
};

module.exports = Scheduler;
