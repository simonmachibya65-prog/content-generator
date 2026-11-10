const axios = require('axios');

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI;

const SCOPES = ['user.info.basic', 'video.publish', 'video.upload'].join(',');

const TikTokAdapter = {
  /**
   * Get TikTok OAuth authorization URL
   */
  getAuthorizationUrl(state, codeChallenge) {
    const params = new URLSearchParams({
      client_key: CLIENT_KEY,
      scope: SCOPES,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });
    return `https://www.tiktok.com/v2/auth/authorize/?${params}`;
  },

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code, codeVerifier) {
    const response = await axios.post(
      'https://open.tiktokapis.com/v2/oauth/token/',
      new URLSearchParams({
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const data = response.data;
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      scope: data.scope,
      open_id: data.open_id
    };
  },

  /**
   * Get authenticated user profile
   */
  async getProfile(accessToken) {
    const response = await axios.get(
      'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const user = response.data.data.user;
    return {
      id: user.open_id,
      username: user.username || user.open_id,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      profile_url: `https://www.tiktok.com/@${user.username}`,
      followers_count: user.follower_count || 0
    };
  },

  /**
   * Refresh an expired access token
   */
  async refreshToken(refreshToken) {
    const response = await axios.post(
      'https://open.tiktokapis.com/v2/oauth/token/',
      new URLSearchParams({
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in
    };
  },

  /**
   * Publish a video to TikTok
   */
  async publishVideo(accessToken, { videoUrl, title, description, privacyLevel = 'PUBLIC_TO_EVERYONE' }) {
    // Step 1: Initialize upload
    const initRes = await axios.post(
      'https://open.tiktokapis.com/v2/post/publish/video/init/',
      {
        post_info: {
          title: title || description,
          privacy_level: privacyLevel,
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: videoUrl
        }
      },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    return { publish_id: initRes.data.data.publish_id };
  }
};

module.exports = TikTokAdapter;
