const express = require('express');
const { authenticate } = require('../middleware/auth');
const { generateOAuthState, generateCodeVerifier, generateCodeChallenge } = require('../utils/crypto');
const { query, transaction } = require('../database');
const { encrypt } = require('../utils/crypto');
const logger = require('../utils/logger');

// Platform adapters
const TikTokAdapter = require('../adapters/tiktok');
const YouTubeAdapter = require('../adapters/youtube');
const XAdapter = require('../adapters/x');
const InstagramAdapter = require('../adapters/instagram');
const FacebookAdapter = require('../adapters/facebook');
const LinkedInAdapter = require('../adapters/linkedin');

const router = express.Router();

const ADAPTERS = {
  tiktok: TikTokAdapter,
  youtube: YouTubeAdapter,
  x: XAdapter,
  instagram: InstagramAdapter,
  facebook: FacebookAdapter,
  linkedin: LinkedInAdapter
};

// ─── GET /api/oauth/:platform/connect ────────────────────────
// Detects platform from pasted URL and initiates OAuth
router.post('/detect', authenticate, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });

    const platform = detectPlatformFromUrl(url);
    if (!platform) {
      return res.status(400).json({ error: 'Could not detect platform from URL. Please try connecting manually.' });
    }

    const username = extractUsernameFromUrl(url, platform);
    res.json({ platform, username, detected: true });
  } catch (err) {
    res.status(500).json({ error: 'Detection failed' });
  }
});

// ─── GET /api/oauth/:platform/authorize ──────────────────────
router.get('/:platform/authorize', authenticate, async (req, res) => {
  try {
    const { platform } = req.params;
    const Adapter = ADAPTERS[platform];

    if (!Adapter) {
      return res.status(400).json({ error: `Platform '${platform}' not supported` });
    }

    const state = generateOAuthState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    // Store state in DB for validation
    await query(
      `INSERT INTO oauth_states (user_id, platform, state, code_verifier, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '15 minutes')`,
      [req.user.id, platform, state, codeVerifier]
    );

    const authUrl = Adapter.getAuthorizationUrl(state, codeChallenge);
    res.json({ authUrl, state });
  } catch (err) {
    logger.error(`OAuth authorize error for ${req.params.platform}:`, err);
    res.status(500).json({ error: 'Failed to initiate OAuth' });
  }
});

// ─── GET /api/oauth/:platform/callback ───────────────────────
router.get('/:platform/callback', async (req, res) => {
  const { platform } = req.params;
  const { code, state, error: oauthError } = req.query;
  const frontendUrl = process.env.APP_URL || 'http://localhost:3000';

  try {
    if (oauthError) {
      return res.redirect(`${frontendUrl}/settings/social-accounts?error=${oauthError}&platform=${platform}`);
    }

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/settings/social-accounts?error=missing_params&platform=${platform}`);
    }

    // Validate state
    const { rows: stateRows } = await query(
      `SELECT * FROM oauth_states
       WHERE state = $1 AND platform = $2 AND used = FALSE AND expires_at > NOW()`,
      [state, platform]
    );

    if (!stateRows[0]) {
      return res.redirect(`${frontendUrl}/settings/social-accounts?error=invalid_state&platform=${platform}`);
    }

    const stateRecord = stateRows[0];
    const userId = stateRecord.user_id;

    // Mark state as used
    await query('UPDATE oauth_states SET used = TRUE WHERE id = $1', [stateRecord.id]);

    const Adapter = ADAPTERS[platform];
    const tokens = await Adapter.exchangeCode(code, stateRecord.code_verifier);
    const profile = await Adapter.getProfile(tokens.access_token);

    // Save connected account + tokens
    await transaction(async (client) => {
      // Upsert social account
      const { rows: accountRows } = await client.query(
        `INSERT INTO social_accounts
           (user_id, platform_id, platform_name, account_id, username, display_name,
            profile_url, avatar_url, followers_count, status, expires_at)
         VALUES ($1,
           (SELECT id FROM social_platforms WHERE name = $2),
           $2, $3, $4, $5, $6, $7, $8, 'connected',
           ${tokens.expires_in ? `NOW() + INTERVAL '${tokens.expires_in} seconds'` : 'NULL'})
         ON CONFLICT (user_id, platform_name, account_id)
         DO UPDATE SET
           username = EXCLUDED.username,
           display_name = EXCLUDED.display_name,
           avatar_url = EXCLUDED.avatar_url,
           followers_count = EXCLUDED.followers_count,
           status = 'connected',
           updated_at = NOW()
         RETURNING id`,
        [
          userId, platform, profile.id, profile.username,
          profile.display_name, profile.profile_url, profile.avatar_url,
          profile.followers_count || 0
        ]
      );

      const accountId = accountRows[0].id;

      // Upsert tokens
      await client.query(
        `INSERT INTO oauth_tokens (social_account_id, access_token, refresh_token, scope, expires_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (social_account_id)
         DO UPDATE SET
           access_token = EXCLUDED.access_token,
           refresh_token = EXCLUDED.refresh_token,
           expires_at = EXCLUDED.expires_at,
           updated_at = NOW()`,
        [
          accountId,
          encrypt(tokens.access_token),
          tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
          tokens.scope || null,
          tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null
        ]
      );
    });

    logger.info(`OAuth connected: ${platform} for user ${userId}`);
    res.redirect(`${frontendUrl}/settings/social-accounts?success=true&platform=${platform}`);
  } catch (err) {
    logger.error(`OAuth callback error for ${platform}:`, err);
    res.redirect(`${frontendUrl}/settings/social-accounts?error=connection_failed&platform=${platform}`);
  }
});

// ─── DELETE /api/oauth/:platform/disconnect ───────────────────
router.delete('/:platform/disconnect/:accountId', authenticate, async (req, res) => {
  try {
    const { platform, accountId } = req.params;

    const { rows } = await query(
      `UPDATE social_accounts SET status = 'disconnected', updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND platform_name = $3
       RETURNING id`,
      [accountId, req.user.id, platform]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Delete tokens
    await query(
      'DELETE FROM oauth_tokens WHERE social_account_id = $1',
      [accountId]
    );

    res.json({ message: `${platform} account disconnected` });
  } catch (err) {
    logger.error('Disconnect error:', err);
    res.status(500).json({ error: 'Failed to disconnect account' });
  }
});

// ─── Helpers ─────────────────────────────────────────────────
function detectPlatformFromUrl(url) {
  const patterns = {
    tiktok:    /tiktok\.com/i,
    youtube:   /(youtube\.com|youtu\.be)/i,
    x:         /(twitter\.com|x\.com)/i,
    instagram: /instagram\.com/i,
    facebook:  /facebook\.com/i,
    linkedin:  /linkedin\.com/i
  };
  for (const [platform, regex] of Object.entries(patterns)) {
    if (regex.test(url)) return platform;
  }
  return null;
}

function extractUsernameFromUrl(url, platform) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    if (!parts.length) return null;
    const raw = parts[0];
    return raw.startsWith('@') ? raw : `@${raw}`;
  } catch {
    return null;
  }
}

module.exports = router;
