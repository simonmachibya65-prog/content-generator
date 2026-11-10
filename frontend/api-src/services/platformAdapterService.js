const logger = require('../utils/logger');

/**
 * Platform Adaptation Engine
 * Automatically adapts content for each social media platform's requirements
 * Handles format, dimensions, captions, hashtags, and platform-specific optimizations
 */
const PlatformAdapterService = {

  // ═══════════════════════════════════════════════════════════════
  // PLATFORM SPECIFICATIONS
  // ═══════════════════════════════════════════════════════════════

  PLATFORM_SPECS: {
    instagram: {
      feed: {
        aspect_ratios: ['1:1', '4:5', '16:9'],
        image_max_size: 1080,
        caption_max_length: 2200,
        hashtags_max: 30,
        hashtags_recommended: 10,
        video_max_duration: 60,
        video_formats: ['mp4', 'mov']
      },
      reels: {
        aspect_ratio: '9:16',
        resolution: '1080x1920',
        duration_range: [15, 90],
        caption_max_length: 2200,
        hashtags_max: 30
      },
      stories: {
        aspect_ratio: '9:16',
        resolution: '1080x1920',
        duration: 15,
        caption_max_length: 0 // Text overlays only
      }
    },
    tiktok: {
      video: {
        aspect_ratio: '9:16',
        resolution: '1080x1920',
        duration_range: [15, 180],
        caption_max_length: 150,
        hashtags_max: 5,
        hashtags_recommended: 3,
        video_formats: ['mp4', 'mov', 'webm']
      }
    },
    youtube: {
      video: {
        aspect_ratio: '16:9',
        resolution: '1920x1080',
        title_max_length: 100,
        description_max_length: 5000,
        tags_max: 500,
        video_formats: ['mp4', 'mov', 'avi']
      },
      shorts: {
        aspect_ratio: '9:16',
        resolution: '1080x1920',
        duration_max: 60,
        title_max_length: 100
      }
    },
    facebook: {
      feed: {
        aspect_ratios: ['16:9', '1:1', '4:5'],
        image_max_size: 2048,
        caption_max_length: 63206,
        recommended_caption: 400,
        hashtags_max: 50,
        hashtags_recommended: 2,
        video_max_duration: 240,
        video_formats: ['mp4', 'mov']
      },
      stories: {
        aspect_ratio: '9:16',
        resolution: '1080x1920',
        duration: 20
      }
    },
    x: {
      post: {
        text_max_length: 280,
        text_max_length_premium: 25000,
        hashtags_recommended: 2,
        image_aspect_ratios: ['16:9', '1:1'],
        video_max_duration: 140,
        video_max_duration_premium: 600
      }
    },
    linkedin: {
      post: {
        text_max_length: 3000,
        recommended_length: 1300,
        hashtags_max: 30,
        hashtags_recommended: 5,
        image_aspect_ratio: '1.91:1',
        video_max_duration: 600
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // MAIN ADAPTATION FUNCTIONS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Adapt content for all selected platforms
   * Returns platform-specific versions
   */
  async adaptForAllPlatforms(content, platforms = []) {
    const adaptations = {};

    for (const platform of platforms) {
      try {
        const adapted = await this.adaptForPlatform(content, platform);
        adaptations[platform] = adapted;
      } catch (err) {
        logger.error(`Platform adaptation failed for ${platform}:`, err);
        adaptations[platform] = { error: err.message };
      }
    }

    return adaptations;
  },

  /**
   * Adapt content for specific platform
   */
  async adaptForPlatform(content, platform) {
    switch (platform) {
      case 'instagram':
        return this.adaptForInstagram(content);
      case 'tiktok':
        return this.adaptForTikTok(content);
      case 'youtube':
        return this.adaptForYouTube(content);
      case 'facebook':
        return this.adaptForFacebook(content);
      case 'x':
        return this.adaptForX(content);
      case 'linkedin':
        return this.adaptForLinkedIn(content);
      default:
        return content;
    }
  },

  /**
   * INSTAGRAM ADAPTATION
   */
  async adaptForInstagram(content) {
    const specs = this.PLATFORM_SPECS.instagram;
    const contentType = content.media_type || (content.video_url ? 'reels' : 'feed');
    const spec = specs[contentType];

    return {
      platform: 'instagram',
      format: contentType,
      caption: this.truncateText(content.caption || content.text, spec.caption_max_length),
      hashtags: this.optimizeHashtags(content.hashtags, spec.hashtags_recommended),
      media_url: content.image_url || content.video_url,
      media_type: content.video_url ? 'VIDEO' : 'IMAGE',
      aspect_ratio: spec.aspect_ratio || '1:1',
      resolution: spec.resolution || '1080x1080',
      location: content.location || null,
      alt_text: content.alt_text || this.generateAltText(content),
      best_times: ['09:00', '12:00', '18:00', '21:00'],
      engagement_tips: [
        'Use first-person storytelling',
        'Ask questions in captions',
        'Include call-to-action',
        'Use trending audio for Reels'
      ]
    };
  },

  /**
   * TIKTOK ADAPTATION
   */
  async adaptForTikTok(content) {
    const specs = this.PLATFORM_SPECS.tiktok.video;

    // TikTok needs hook in first 3 seconds
    const hook = this.generateTikTokHook(content.caption || content.text);

    return {
      platform: 'tiktok',
      format: 'video',
      title: this.truncateText(content.title || content.caption, 100),
      description: this.truncateText(content.caption || content.text, specs.caption_max_length),
      hashtags: this.optimizeHashtags(content.hashtags, specs.hashtags_recommended),
      video_url: content.video_url,
      aspect_ratio: '9:16',
      resolution: '1080x1920',
      duration_recommended: 21, // Sweet spot for TikTok
      hook: hook,
      privacy_level: content.privacy_level || 'PUBLIC_TO_EVERYONE',
      best_times: ['07:00', '12:00', '15:00', '20:00'],
      engagement_tips: [
        'Hook viewers in first 3 seconds',
        'Use trending sounds',
        'Add text overlays',
        'Include strong CTA'
      ]
    };
  },

  /**
   * YOUTUBE ADAPTATION
   */
  async adaptForYouTube(content) {
    const specs = this.PLATFORM_SPECS.youtube.video;

    return {
      platform: 'youtube',
      format: 'video',
      title: this.truncateText(this.optimizeYouTubeTitle(content.title || content.caption), specs.title_max_length),
      description: this.formatYouTubeDescription(content),
      tags: this.optimizeYouTubeTags(content.hashtags, content.caption),
      video_url: content.video_url,
      thumbnail_url: content.thumbnail_url || content.image_url,
      aspect_ratio: '16:9',
      resolution: '1920x1080',
      category_id: content.category_id || '22', // People & Blogs
      privacy_status: content.privacy_status || 'public',
      made_for_kids: false,
      best_times: ['14:00', '17:00', '20:00'],
      engagement_tips: [
        'Create compelling thumbnail',
        'Use searchable keywords in title',
        'Add timestamps in description',
        'Include channel links'
      ]
    };
  },

  /**
   * FACEBOOK ADAPTATION
   */
  async adaptForFacebook(content) {
    const specs = this.PLATFORM_SPECS.facebook.feed;

    return {
      platform: 'facebook',
      format: 'feed',
      message: this.truncateText(content.caption || content.text, specs.recommended_caption),
      hashtags: this.optimizeHashtags(content.hashtags, specs.hashtags_recommended),
      image_url: content.image_url,
      video_url: content.video_url,
      link: content.link || null,
      aspect_ratio: '16:9',
      cta_button: content.cta_button || null,
      targeting: content.targeting || null,
      best_times: ['09:00', '13:00', '19:00'],
      engagement_tips: [
        'Keep text concise',
        'Use emojis sparingly',
        'Include link in first comment if needed',
        'Tag relevant pages/people'
      ]
    };
  },

  /**
   * X (TWITTER) ADAPTATION
   */
  async adaptForX(content) {
    const specs = this.PLATFORM_SPECS.x.post;

    // Twitter threads if content is long
    const tweets = this.splitIntoTwitterThreads(content.text || content.caption, specs.text_max_length);

    return {
      platform: 'x',
      format: 'post',
      text: tweets[0], // Main tweet
      thread: tweets.length > 1 ? tweets : null,
      hashtags: this.optimizeHashtags(content.hashtags, specs.hashtags_recommended),
      media_url: content.image_url || content.video_url,
      aspect_ratio: '16:9',
      link: content.link || null,
      best_times: ['08:00', '12:00', '17:00', '20:00'],
      engagement_tips: [
        'Be concise and direct',
        'Use 1-2 hashtags max',
        'Include media for 2x engagement',
        'Respond to replies quickly'
      ]
    };
  },

  /**
   * LINKEDIN ADAPTATION
   */
  async adaptForLinkedIn(content) {
    const specs = this.PLATFORM_SPECS.linkedin.post;

    return {
      platform: 'linkedin',
      format: 'post',
      text: this.formatLinkedInPost(content.text || content.caption, specs.recommended_length),
      hashtags: this.optimizeHashtags(content.hashtags, specs.hashtags_recommended),
      image_url: content.image_url,
      video_url: content.video_url,
      article_link: content.link || null,
      aspect_ratio: '1.91:1',
      tone: 'professional',
      best_times: ['08:00', '12:00', '17:00'],
      engagement_tips: [
        'Use professional tone',
        'Share insights and lessons',
        'Tag relevant companies',
        'Ask for opinions/engagement'
      ]
    };
  },

  // ═══════════════════════════════════════════════════════════════
  // HELPER FUNCTIONS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Truncate text to max length, preserving words
   */
  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    
    const truncated = text.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...';
  },

  /**
   * Optimize hashtags for platform
   */
  optimizeHashtags(hashtags = [], recommended = 5) {
    if (!hashtags || !Array.isArray(hashtags)) return [];
    
    return hashtags
      .slice(0, recommended)
      .map(tag => tag.startsWith('#') ? tag : `#${tag}`);
  },

  /**
   * Generate TikTok hook (first 3 seconds)
   */
  generateTikTokHook(caption) {
    const hooks = [
      'Wait for it...',
      'You need to see this!',
      'This changed everything:',
      'Stop scrolling!',
      'Here\'s why:'
    ];
    
    // Extract first sentence or use generic hook
    const firstSentence = caption?.split('.')[0];
    return firstSentence && firstSentence.length < 50 
      ? firstSentence 
      : hooks[Math.floor(Math.random() * hooks.length)];
  },

  /**
   * Optimize YouTube title for SEO
   */
  optimizeYouTubeTitle(title) {
    // Ensure title has important keywords first
    // Add emotional trigger words
    const triggers = ['Amazing', 'Incredible', 'Secret', 'How To', 'Ultimate'];
    
    if (!title) return 'Untitled Video';
    
    // If title is too generic, enhance it
    if (title.length < 20) {
      return `${triggers[0]} ${title}`;
    }
    
    return title;
  },

  /**
   * Format YouTube description with timestamps, links, etc.
   */
  formatYouTubeDescription(content) {
    const description = content.description || content.caption || '';
    
    const formatted = `${description}

━━━━━━━━━━━━━━━━━━━━

📌 TIMESTAMPS:
0:00 - Introduction
[Add your timestamps here]

━━━━━━━━━━━━━━━━━━━━

🔗 LINKS:
${content.link || '[Your website]'}
${content.social_links || '[Social media links]'}

━━━━━━━━━━━━━━━━━━━━

📱 FOLLOW US:
Instagram: [Your Instagram]
TikTok: [Your TikTok]
Twitter: [Your Twitter]

━━━━━━━━━━━━━━━━━━━━

#${(content.hashtags || []).map(h => h.replace('#', '')).join(' #')}`;

    return formatted;
  },

  /**
   * Optimize YouTube tags
   */
  optimizeYouTubeTags(hashtags = [], caption = '') {
    const tags = [...(hashtags || [])];
    
    // Extract keywords from caption
    const words = caption?.split(' ') || [];
    const keywords = words
      .filter(w => w.length > 5)
      .slice(0, 10);
    
    return [...new Set([...tags, ...keywords])].slice(0, 15);
  },

  /**
   * Split content into Twitter thread
   */
  splitIntoTwitterThreads(text, maxLength = 280) {
    if (!text || text.length <= maxLength) return [text];
    
    const tweets = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let currentTweet = '';
    
    for (const sentence of sentences) {
      if ((currentTweet + sentence).length <= maxLength - 10) {
        currentTweet += sentence;
      } else {
        if (currentTweet) tweets.push(currentTweet.trim());
        currentTweet = sentence;
      }
    }
    
    if (currentTweet) tweets.push(currentTweet.trim());
    
    // Add thread numbers
    return tweets.map((tweet, i) => 
      tweets.length > 1 ? `${i + 1}/${tweets.length} ${tweet}` : tweet
    );
  },

  /**
   * Format LinkedIn post (professional tone)
   */
  formatLinkedInPost(text, recommendedLength = 1300) {
    if (!text) return '';
    
    // LinkedIn likes line breaks for readability
    const formatted = text.length > recommendedLength
      ? this.truncateText(text, recommendedLength)
      : text;
    
    // Add professional opener if missing
    const openers = [
      '💡 Insight:',
      '📊 Key Takeaway:',
      '🎯 Strategy:',
      '✨ Lesson Learned:'
    ];
    
    const hasOpener = openers.some(o => formatted.startsWith(o));
    
    return hasOpener ? formatted : `${openers[0]} ${formatted}`;
  },

  /**
   * Generate alt text for accessibility
   */
  generateAltText(content) {
    return content.alt_text || 
           content.title || 
           'Social media post image';
  },

  /**
   * Get optimal posting times for platform
   */
  getOptimalPostingTimes(platform) {
    const times = {
      instagram: ['09:00', '12:00', '18:00', '21:00'],
      tiktok: ['07:00', '12:00', '15:00', '20:00'],
      youtube: ['14:00', '17:00', '20:00'],
      facebook: ['09:00', '13:00', '19:00'],
      x: ['08:00', '12:00', '17:00', '20:00'],
      linkedin: ['08:00', '12:00', '17:00']
    };
    
    return times[platform] || ['09:00', '18:00'];
  }
};

module.exports = PlatformAdapterService;
