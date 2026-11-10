const axios = require('axios');

const APP_ID = process.env.META_APP_ID;
const APP_SECRET = process.env.META_APP_SECRET;
const REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI;

const SCOPES = [
  'pages_manage_posts',
  'pages_read_engagement',
  'pages_show_list',
  'publish_video'
].join(',');

const FacebookAdapter = {
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
      expires_in: longRes.data.expires_in || 5184000
    };
  },

  async getProfile(accessToken) {
    // Get the user's pages
    const pagesRes = await axios.get(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );

    const page = pagesRes.data.data?.[0];
    if (!page) throw new Error('No Facebook Page found. Please create a Facebook Page first.');

    const pageRes = await axios.get(
      `https://graph.facebook.com/v18.0/${page.id}?fields=id,name,picture,fan_count&access_token=${page.access_token}`
    );

    return {
      id: page.id,
      username: page.name,
      display_name: page.name,
      avatar_url: pageRes.data.picture?.data?.url,
      profile_url: `https://www.facebook.com/${page.id}`,
      followers_count: pageRes.data.fan_count || 0,
      page_access_token: page.access_token
    };
  },

  /**
   * Publish a post to Facebook Page
   */
  async publishPost(pageAccessToken, pageId, { message, link, imageUrl }) {
    const body = { message, access_token: pageAccessToken };
    if (link) body.link = link;

    let endpoint = `https://graph.facebook.com/v18.0/${pageId}/feed`;

    if (imageUrl) {
      endpoint = `https://graph.facebook.com/v18.0/${pageId}/photos`;
      body.url = imageUrl;
      body.caption = message;
    }

    const response = await axios.post(endpoint, body);
    return {
      platform_post_id: response.data.id,
      platform_post_url: `https://www.facebook.com/${response.data.id}`
    };
  },

  /**
   * Publish a video to Facebook Page
   */
  async publishVideo(pageAccessToken, pageId, { videoUrl, title, description }) {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${pageId}/videos`,
      {
        file_url: videoUrl,
        title,
        description,
        access_token: pageAccessToken
      }
    );
    return {
      platform_post_id: response.data.id,
      platform_post_url: `https://www.facebook.com/video/${response.data.id}`
    };
  }
};

module.exports = FacebookAdapter;
