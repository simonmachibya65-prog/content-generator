const axios = require('axios');

const APP_ID = process.env.META_APP_ID;
const APP_SECRET = process.env.META_APP_SECRET;
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;

const SCOPES = [
  'instagram_basic',
  'instagram_content_publish',
  'instagram_manage_insights',
  'pages_read_engagement'
].join(',');

const InstagramAdapter = {
  getAuthorizationUrl(state) {
    const params = new URLSearchParams({
      client_id: APP_ID,
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      response_type: 'code',
      state
    });
    return `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
  },

  async exchangeCode(code) {
    // Exchange for short-lived token
    const shortRes = await axios.post(
      'https://graph.facebook.com/v18.0/oauth/access_token',
      new URLSearchParams({
        client_id: APP_ID,
        client_secret: APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    // Exchange for long-lived token
    const longRes = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${shortRes.data.access_token}`
    );

    return {
      access_token: longRes.data.access_token,
      expires_in: longRes.data.expires_in || 5184000 // ~60 days
    };
  },

  async getProfile(accessToken) {
    // Get Instagram Business Account linked to Facebook page
    const meRes = await axios.get(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );

    const page = meRes.data.data?.[0];
    if (!page) throw new Error('No Facebook page found. Instagram must be linked to a Facebook page.');

    const igRes = await axios.get(
      `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
    );

    const igId = igRes.data.instagram_business_account?.id;
    if (!igId) throw new Error('No Instagram Business account linked to this Facebook page.');

    const profileRes = await axios.get(
      `https://graph.facebook.com/v18.0/${igId}?fields=id,username,name,profile_picture_url,followers_count&access_token=${page.access_token}`
    );

    const profile = profileRes.data;
    return {
      id: profile.id,
      username: `@${profile.username}`,
      display_name: profile.name,
      avatar_url: profile.profile_picture_url,
      profile_url: `https://www.instagram.com/${profile.username}`,
      followers_count: profile.followers_count || 0,
      page_access_token: page.access_token
    };
  },

  /**
   * Publish an image/reel to Instagram
   */
  async publishPost(pageAccessToken, igAccountId, { imageUrl, videoUrl, caption, mediaType = 'IMAGE' }) {
    // Step 1: Create media container
    const containerParams = {
      caption,
      access_token: pageAccessToken
    };

    if (mediaType === 'IMAGE') {
      containerParams.image_url = imageUrl;
    } else if (mediaType === 'REELS') {
      containerParams.media_type = 'REELS';
      containerParams.video_url = videoUrl;
    }

    const containerRes = await axios.post(
      `https://graph.facebook.com/v18.0/${igAccountId}/media`,
      containerParams
    );

    const containerId = containerRes.data.id;

    // Step 2: Publish container
    const publishRes = await axios.post(
      `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`,
      { creation_id: containerId, access_token: pageAccessToken }
    );

    return {
      platform_post_id: publishRes.data.id,
      platform_post_url: null // Instagram API doesn't return post URL directly
    };
  }
};

module.exports = InstagramAdapter;
