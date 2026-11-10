const axios = require('axios');

const CLIENT_ID = process.env.X_CLIENT_ID;
const CLIENT_SECRET = process.env.X_CLIENT_SECRET;
const REDIRECT_URI = process.env.X_REDIRECT_URI;

const SCOPES = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'].join(' ');

const XAdapter = {
  getAuthorizationUrl(state, codeChallenge) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });
    return `https://twitter.com/i/oauth2/authorize?${params}`;
  },

  async exchangeCode(code, codeVerifier) {
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const response = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier
      }),
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in,
      scope: response.data.scope
    };
  },

  async getProfile(accessToken) {
    const response = await axios.get(
      'https://api.twitter.com/2/users/me?user.fields=profile_image_url,public_metrics,username',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const user = response.data.data;
    return {
      id: user.id,
      username: `@${user.username}`,
      display_name: user.name,
      avatar_url: user.profile_image_url,
      profile_url: `https://x.com/${user.username}`,
      followers_count: user.public_metrics?.followers_count || 0
    };
  },

  async refreshToken(refreshToken) {
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const response = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }),
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in
    };
  },

  /**
   * Publish a tweet (text + optional media)
   */
  async publishPost(accessToken, { text, mediaIds = [] }) {
    const body = { text };
    if (mediaIds.length > 0) {
      body.media = { media_ids: mediaIds };
    }
    const response = await axios.post(
      'https://api.twitter.com/2/tweets',
      body,
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    const tweet = response.data.data;
    return {
      platform_post_id: tweet.id,
      platform_post_url: `https://x.com/i/web/status/${tweet.id}`
    };
  },

  /**
   * Upload media to X
   */
  async uploadMedia(accessToken, { fileBuffer, mimeType }) {
    const response = await axios.post(
      'https://upload.twitter.com/1.1/media/upload.json',
      { media_data: fileBuffer.toString('base64') },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    return response.data.media_id_string;
  }
};

module.exports = XAdapter;
