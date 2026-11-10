const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ');

const YouTubeAdapter = {
  getAuthorizationUrl(state, codeChallenge) {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  },

  async exchangeCode(code, codeVerifier) {
    const response = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in,
      scope: response.data.scope
    };
  },

  async getProfile(accessToken) {
    // Get YouTube channel info
    const channelRes = await axios.get(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const channel = channelRes.data.items?.[0];
    if (!channel) throw new Error('No YouTube channel found');

    return {
      id: channel.id,
      username: channel.snippet.customUrl || channel.id,
      display_name: channel.snippet.title,
      avatar_url: channel.snippet.thumbnails?.default?.url,
      profile_url: `https://www.youtube.com/channel/${channel.id}`,
      followers_count: parseInt(channel.statistics?.subscriberCount || 0)
    };
  },

  async refreshToken(refreshToken) {
    const response = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return {
      access_token: response.data.access_token,
      expires_in: response.data.expires_in
    };
  },

  /**
   * Upload a video to YouTube
   */
  async publishVideo(accessToken, { videoPath, title, description, tags = [], categoryId = '22', privacyStatus = 'public' }) {
    const metadata = {
      snippet: { title, description, tags, categoryId },
      status: { privacyStatus, selfDeclaredMadeForKids: false }
    };

    // Resumable upload initiation
    const initRes = await axios.post(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      metadata,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': 'video/*'
        }
      }
    );

    const uploadUrl = initRes.headers.location;
    const videoStream = fs.createReadStream(videoPath);
    const stats = fs.statSync(videoPath);

    const uploadRes = await axios.put(uploadUrl, videoStream, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'video/*',
        'Content-Length': stats.size
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });

    return {
      platform_post_id: uploadRes.data.id,
      platform_post_url: `https://www.youtube.com/watch?v=${uploadRes.data.id}`
    };
  }
};

module.exports = YouTubeAdapter;
