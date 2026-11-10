const axios = require('axios');

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI;

const SCOPES = ['openid', 'profile', 'email', 'w_member_social'].join(' ');

const LinkedInAdapter = {
  getAuthorizationUrl(state) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      state,
      scope: SCOPES
    });
    return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
  },

  async exchangeCode(code) {
    const response = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return {
      access_token: response.data.access_token,
      expires_in: response.data.expires_in,
      scope: response.data.scope
    };
  },

  async getProfile(accessToken) {
    const response = await axios.get(
      'https://api.linkedin.com/v2/userinfo',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const user = response.data;
    return {
      id: user.sub,
      username: user.email,
      display_name: user.name,
      avatar_url: user.picture,
      profile_url: `https://www.linkedin.com/in/${user.sub}`,
      followers_count: 0
    };
  },

  async refreshToken() {
    // LinkedIn tokens can't be refreshed; user must reconnect
    throw new Error('LinkedIn tokens must be renewed by re-authorizing');
  },

  /**
   * Publish a text/image post to LinkedIn
   */
  async publishPost(accessToken, authorId, { text, imageUrl }) {
    const body = {
      author: `urn:li:person:${authorId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: imageUrl ? 'IMAGE' : 'NONE',
          ...(imageUrl && {
            media: [{
              status: 'READY',
              description: { text },
              media: imageUrl, // pre-registered asset URN
              title: { text }
            }]
          })
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      body,
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );

    const postId = response.headers['x-restli-id'];
    return {
      platform_post_id: postId,
      platform_post_url: `https://www.linkedin.com/feed/update/${postId}`
    };
  }
};

module.exports = LinkedInAdapter;
