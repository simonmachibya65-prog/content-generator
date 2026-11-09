const { query, transaction } = require('../database');
const { decrypt, encrypt } = require('../utils/crypto');
const logger = require('../utils/logger');

const TikTokAdapter = require('../adapters/tiktok');
const YouTubeAdapter = require('../adapters/youtube');
const XAdapter = require('../adapters/x');
const InstagramAdapter = require('../adapters/instagram');
const FacebookAdapter = require('../adapters/facebook');
const LinkedInAdapter = require('../adapters/linkedin');

const ADAPTERS = {
  tiktok:    TikTokAdapter,
  youtube:   YouTubeAdapter,
  x:         XAdapter,
  instagram: InstagramAdapter,
  facebook:  FacebookAdapter,
  linkedin:  LinkedInAdapter
};

const PublishingService = {

  // ─── Token Management ───────────────────────────────────────

  /**
   * Ensure access token is valid; refresh if expired.
   * Returns a decrypted, fresh access token ready to use.
   */
  async getFreshToken(socialAccountId) {
    const { rows } = await query(
      `SELECT sa.platform_name, ot.access_token, ot.refresh_token, ot.expires_at
       FROM social_accounts sa
       JOIN oauth_tokens ot ON ot.social_account_id = sa.id
       WHERE sa.id = $1`,
      [socialAccountId]
    );

    if (!rows[0]) throw new Error('No token found — please reconnect this account');

    const { platform_name, access_token, refresh_token, expires_at } = rows[0];

    // Token still valid (with 5-minute buffer)
    const isExpired = expires_at && new Date(expires_at) < new Date(Date.now() + 5 * 60 * 1000);

    if (!isExpired) {
      return decrypt(access_token);
    }

    // Token expired — attempt refresh
    if (!refresh_token) {
      // Mark account as expired so UI shows reconnect prompt
      await query(
        `UPDATE social_accounts SET status = 'expired' WHERE id = $1`,
        [socialAccountId]
      );
      throw new Error(`${platform_name} token expired and cannot be refreshed. Please reconnect.`);
    }

    const Adapter = ADAPTERS[platform_name];
    if (!Adapter?.refreshToken) {
      await query(`UPDATE social_accounts SET status = 'expired' WHERE id = $1`, [socialAccountId]);
      throw new Error(`${platform_name} requires reconnection`);
    }

    try {
      logger.info(`Refreshing token for account ${socialAccountId} (${platform_name})`);
      const newTokens = await Adapter.refreshToken(decrypt(refresh_token));

      // Persist refreshed tokens
      await query(
        `UPDATE oauth_tokens
         SET access_token = $1,
             refresh_token = COALESCE($2, refresh_token),
             expires_at    = $3,
             updated_at    = NOW()
         WHERE social_account_id = $4`,
        [
          encrypt(newTokens.access_token),
          newTokens.refresh_token ? encrypt(newTokens.refresh_token) : null,
          newTokens.expires_in ? new Date(Date.now() + newTokens.expires_in * 1000) : null,
          socialAccountId
        ]
      );

      await query(
        `UPDATE social_accounts SET status = 'connected', updated_at = NOW() WHERE id = $1`,
        [socialAccountId]
      );

      logger.info(`Token refreshed for account ${socialAccountId}`);
      return newTokens.access_token;
    } catch (err) {
      await query(`UPDATE social_accounts SET status = 'expired' WHERE id = $1`, [socialAccountId]);
      throw new Error(`Failed to refresh ${platform_name} token. Please reconnect: ${err.message}`);
    }
  },

  /**
   * Proactively refresh tokens expiring within 24 hours.
   * Called by the scheduler daily.
   */
  async refreshExpiringTokens() {
    const { rows } = await query(
      `SELECT sa.id, sa.platform_name, sa.user_id
       FROM social_accounts sa
       JOIN oauth_tokens ot ON ot.social_account_id = sa.id
       WHERE sa.status = 'connected'
         AND ot.refresh_token IS NOT NULL
         AND ot.expires_at IS NOT NULL
         AND ot.expires_at < NOW() + INTERVAL '24 hours'`
    );

    logger.info(`Proactively refreshing ${rows.length} expiring tokens`);

    for (const account of rows) {
      try {
        await this.getFreshToken(account.id);
      } catch (err) {
        logger.warn(`Could not refresh token for account ${account.id}: ${err.message}`);
      }
    }
  },

  // ─── Scheduling ─────────────────────────────────────────────

  /**
   * Schedule publishing jobs for a post across selected accounts
   */
  async schedulePost(postId, socialAccountIds, scheduledAt) {
    const jobs = [];
    for (const accountId of socialAccountIds) {
      const { rows } = await query(
        'SELECT user_id, platform_name FROM social_accounts WHERE id = $1',
        [accountId]
      );
      if (!rows[0]) continue;

      const { rows: jobRows } = await query(
        `INSERT INTO publishing_jobs
           (post_id, social_account_id, user_id, platform_name, status, scheduled_at)
         VALUES ($1, $2, $3, $4, 'pending', $5)
         RETURNING id`,
        [postId, accountId, rows[0].user_id, rows[0].platform_name, scheduledAt]
      );
      jobs.push(jobRows[0]);
    }
    return jobs;
  },

  // ─── Execution ──────────────────────────────────────────────

  /**
   * Execute a single publishing job with token refresh + retry logic
   */
  async executeJob(jobId) {
    const { rows } = await query(
      `SELECT pj.*, p.content_text, p.hashtags, p.media_ids, p.platform_data,
              p.title, sa.account_id AS platform_account_id, sa.id AS social_account_id
       FROM publishing_jobs pj
       JOIN posts p ON p.id = pj.post_id
       JOIN social_accounts sa ON sa.id = pj.social_account_id
       WHERE pj.id = $1`,
      [jobId]
    );

    const job = rows[0];
    if (!job) throw new Error(`Job ${jobId} not found`);

    if (job.status === 'published') {
      logger.warn(`Job ${jobId} already published — skipping`);
      return;
    }

    await query(
      'UPDATE publishing_jobs SET status = $1, updated_at = NOW() WHERE id = $2',
      ['processing', jobId]
    );
    await this.logJob(jobId, 'info', `Starting publish to ${job.platform_name}`);

    try {
      // Verify account is still connected
      const { rows: accountRows } = await query(
        'SELECT status FROM social_accounts WHERE id = $1',
        [job.social_account_id]
      );
      if (!accountRows[0] || !['connected', 'active'].includes(accountRows[0].status)) {
        throw new Error(`Account not connected. Please reconnect your ${job.platform_name} account.`);
      }

      // Get a fresh (auto-refreshed) access token
      const accessToken = await this.getFreshToken(job.social_account_id);

      const platformData = (typeof job.platform_data === 'string'
        ? JSON.parse(job.platform_data)
        : job.platform_data)?.[job.platform_name] || {};

      const Adapter = ADAPTERS[job.platform_name];
      if (!Adapter) throw new Error(`No adapter for platform: ${job.platform_name}`);

      let result;

      switch (job.platform_name) {
        case 'x':
          result = await Adapter.publishPost(accessToken, {
            text: platformData.text || job.content_text
          });
          break;

        case 'facebook':
          result = await Adapter.publishPost(
            accessToken,
            job.platform_account_id,
            {
              message:  platformData.message  || job.content_text,
              imageUrl: platformData.image_url || null
            }
          );
          break;

        case 'instagram':
          result = await Adapter.publishPost(
            accessToken,
            job.platform_account_id,
            {
              caption:   platformData.caption   || job.content_text,
              imageUrl:  platformData.image_url  || null,
              videoUrl:  platformData.video_url  || null,
              mediaType: platformData.media_type || 'IMAGE'
            }
          );
          break;

        case 'linkedin':
          result = await Adapter.publishPost(
            accessToken,
            job.platform_account_id,
            {
              text:     platformData.text     || job.content_text,
              imageUrl: platformData.image_url || null
            }
          );
          break;

        case 'tiktok':
          if (!platformData.video_url && !(job.media_ids?.length)) {
            throw new Error('TikTok requires a video file. Please attach a video.');
          }
          result = await Adapter.publishVideo(accessToken, {
            videoUrl:    platformData.video_url,
            title:       platformData.title       || job.title,
            description: platformData.description || job.content_text,
            privacyLevel: platformData.privacy_level || 'PUBLIC_TO_EVERYONE'
          });
          break;

        case 'youtube':
          if (!platformData.video_url && !platformData.video_path) {
            throw new Error('YouTube requires a video file. Please attach a video.');
          }
          result = await Adapter.publishVideo(accessToken, {
            videoPath:   platformData.video_path,
            title:       platformData.title       || job.title       || 'Untitled',
            description: platformData.description || job.content_text,
            tags:        platformData.tags         || [],
            privacyStatus: platformData.privacy_status || 'public'
          });
          break;

        default:
          throw new Error(`Unsupported platform: ${job.platform_name}`);
      }

      // Mark job published
      await query(
        `UPDATE publishing_jobs
         SET status = 'published', published_at = NOW(),
             platform_post_id = $1, platform_post_url = $2,
             response_data = $3, updated_at = NOW()
         WHERE id = $4`,
        [result?.platform_post_id, result?.platform_post_url, JSON.stringify(result), jobId]
      );

      await this.notifyUser(
        job.user_id, 'post_published',
        '✅ Post Published',
        `Your post was successfully published to ${job.platform_name}.`
      );

      await this.checkPostCompletion(job.post_id);
      await this.logJob(jobId, 'info', `Successfully published to ${job.platform_name}`);
      logger.info(`Published job ${jobId} → ${job.platform_name}`);

      return result;
    } catch (err) {
      const retryCount = (job.retry_count || 0) + 1;
      const maxRetries = 4;
      const retryDelaysSec = [60, 300, 900, 3600]; // 1m, 5m, 15m, 1h
      const nextRetryAt = new Date(Date.now() + (retryDelaysSec[retryCount - 1] || 3600) * 1000);

      if (retryCount < maxRetries) {
        await query(
          `UPDATE publishing_jobs
           SET status = 'pending', error_message = $1,
               retry_count = $2, next_retry_at = $3, updated_at = NOW()
           WHERE id = $4`,
          [err.message, retryCount, nextRetryAt, jobId]
        );
        await this.logJob(jobId, 'warning',
          `Attempt ${retryCount}/${maxRetries} failed: ${err.message}. Retrying in ${retryDelaysSec[retryCount - 1]}s`);
      } else {
        await query(
          `UPDATE publishing_jobs
           SET status = 'failed', error_message = $1,
               retry_count = $2, updated_at = NOW()
           WHERE id = $3`,
          [err.message, retryCount, jobId]
        );
        await this.logJob(jobId, 'error', `Permanently failed after ${maxRetries} attempts: ${err.message}`);
        await this.notifyUser(
          job.user_id, 'post_failed',
          '❌ Publishing Failed',
          `Failed to publish to ${job.platform_name}: ${err.message}`
        );
      }

      logger.error(`Job ${jobId} failed (attempt ${retryCount}):`, err);
      throw err;
    }
  },

  /**
   * Process all due publishing jobs (called by scheduler)
   */
  async processDueJobs() {
    const { rows } = await query(
      `SELECT id FROM publishing_jobs
       WHERE status = 'pending'
         AND (scheduled_at IS NULL OR scheduled_at <= NOW())
         AND (next_retry_at IS NULL OR next_retry_at <= NOW())
         AND retry_count < 4
       ORDER BY scheduled_at ASC NULLS FIRST
       LIMIT 50`
    );

    if (rows.length > 0) {
      logger.info(`Processing ${rows.length} due publishing jobs`);
    }

    for (const { id } of rows) {
      try {
        await this.executeJob(id);
      } catch (err) {
        logger.error(`Job ${id} execution error:`, err);
      }
    }
  },

  // ─── Helpers ────────────────────────────────────────────────

  async checkPostCompletion(postId) {
    const { rows } = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status NOT IN ('published','failed','cancelled')) AS pending
       FROM publishing_jobs WHERE post_id = $1`,
      [postId]
    );
    if (rows[0].pending === '0') {
      await query(
        `UPDATE posts SET status = 'published', published_at = NOW() WHERE id = $1`,
        [postId]
      );
    }
  },

  async notifyUser(userId, type, title, message) {
    try {
      await query(
        'INSERT INTO notifications (user_id, type, title, message) VALUES ($1, $2, $3, $4)',
        [userId, type, title, message]
      );
    } catch (err) {
      logger.error('Notify user error:', err);
    }
  },

  async logJob(jobId, level, message, metadata = {}) {
    try {
      await query(
        'INSERT INTO publishing_logs (publishing_job_id, level, message, metadata) VALUES ($1, $2, $3, $4)',
        [jobId, level, message, JSON.stringify(metadata)]
      );
    } catch (_) { /* non-critical */ }
  },

  async scheduleAutopilotPost(userId, postId, socialAccountIds, preferredTimes, timezone) {
    const nextSlot = this.findNextAvailableSlot(preferredTimes, timezone);
    return this.schedulePost(postId, socialAccountIds, nextSlot);
  },

  findNextAvailableSlot(preferredTimes, timezone) {
    const now = new Date();
    for (const time of (preferredTimes || ['09:00'])) {
      const [h, m] = time.split(':').map(Number);
      const slot = new Date(now);
      slot.setHours(h, m, 0, 0);
      if (slot > now) return slot;
    }
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  }
};

module.exports = PublishingService;
