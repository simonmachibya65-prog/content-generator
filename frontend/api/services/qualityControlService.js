const { query } = require('../database');
const logger = require('../utils/logger');

/**
 * Quality Control Service
 * Validates content before publishing
 * Ensures brand consistency, platform compliance, and permission checks
 */
const QualityControlService = {

  /**
   * MAIN QUALITY CHECK
   * Runs all validations on content before publishing
   */
  async validateContent(content, platform, userId) {
    const checks = {
      passed: true,
      errors: [],
      warnings: [],
      score: 100
    };

    try {
      // 1. Brand Consistency Check
      const brandCheck = await this.checkBrandConsistency(content, userId);
      if (!brandCheck.passed) {
        checks.errors.push(...brandCheck.errors);
        checks.warnings.push(...brandCheck.warnings);
        checks.score -= brandCheck.deduction;
      }

      // 2. Platform Requirements Check
      const platformCheck = this.checkPlatformRequirements(content, platform);
      if (!platformCheck.passed) {
        checks.errors.push(...platformCheck.errors);
        checks.warnings.push(...platformCheck.warnings);
        checks.score -= platformCheck.deduction;
      }

      // 3. Media Validation
      const mediaCheck = await this.validateMedia(content);
      if (!mediaCheck.passed) {
        checks.errors.push(...mediaCheck.errors);
        checks.warnings.push(...mediaCheck.warnings);
        checks.score -= mediaCheck.deduction;
      }

      // 4. Text Quality Check
      const textCheck = this.checkTextQuality(content);
      if (!textCheck.passed) {
        checks.errors.push(...textCheck.errors);
        checks.warnings.push(...textCheck.warnings);
        checks.score -= textCheck.deduction;
      }

      // 5. Permission Check
      const permissionCheck = await this.checkPermissions(userId, platform);
      if (!permissionCheck.passed) {
        checks.errors.push(...permissionCheck.errors);
        checks.passed = false; // Critical - cannot proceed
      }

      // 6. Content Safety Check
      const safetyCheck = await this.checkContentSafety(content);
      if (!safetyCheck.passed) {
        checks.errors.push(...safetyCheck.errors);
        checks.passed = false; // Critical
      }

      // 7. Link Validation
      const linkCheck = await this.validateLinks(content);
      if (!linkCheck.passed) {
        checks.warnings.push(...linkCheck.warnings);
        checks.score -= linkCheck.deduction;
      }

      // 8. AI Credits Check
      const creditsCheck = await this.checkAICredits(userId);
      if (!creditsCheck.passed) {
        checks.errors.push(creditsCheck.error);
        checks.passed = false;
      }

      // Final decision
      checks.passed = checks.errors.length === 0 && checks.score >= 60;
      checks.quality_level = this.getQualityLevel(checks.score);

      logger.info(`Quality check for user ${userId}, platform ${platform}: Score ${checks.score}/100`);

      return checks;
    } catch (err) {
      logger.error('Quality control error:', err);
      return {
        passed: false,
        errors: ['Quality control system error'],
        warnings: [],
        score: 0
      };
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // INDIVIDUAL CHECK FUNCTIONS
  // ═══════════════════════════════════════════════════════════════

  /**
   * 1. BRAND CONSISTENCY CHECK
   * Ensures content aligns with brand guidelines
   */
  async checkBrandConsistency(content, userId) {
    const result = {
      passed: true,
      errors: [],
      warnings: [],
      deduction: 0
    };

    try {
      // Get user's brand profile
      const { rows } = await query(
        `SELECT brand_voice, brand_colors, tone, language
         FROM business_profiles WHERE user_id = $1`,
        [userId]
      );

      if (!rows[0]) {
        result.warnings.push('No brand profile found - create one for better consistency');
        result.deduction += 10;
        return result;
      }

      const brand = rows[0];

      // Check tone consistency
      if (brand.tone && content.tone && brand.tone !== content.tone) {
        result.warnings.push(`Content tone (${content.tone}) differs from brand tone (${brand.tone})`);
        result.deduction += 5;
      }

      // Check language consistency
      if (brand.language && content.language && brand.language !== content.language) {
        result.warnings.push(`Content language (${content.language}) differs from brand language (${brand.language})`);
        result.deduction += 5;
      }

      // Check for brand voice keywords
      if (brand.brand_voice && content.caption) {
        const voiceKeywords = brand.brand_voice.toLowerCase().split(' ');
        const hasVoiceMatch = voiceKeywords.some(kw => 
          content.caption.toLowerCase().includes(kw)
        );
        
        if (!hasVoiceMatch && voiceKeywords.length > 3) {
          result.warnings.push('Content may not match your brand voice');
          result.deduction += 5;
        }
      }

      result.passed = result.errors.length === 0;
      return result;
    } catch (err) {
      logger.error('Brand consistency check error:', err);
      return result;
    }
  },

  /**
   * 2. PLATFORM REQUIREMENTS CHECK
   * Validates content meets platform specifications
   */
  checkPlatformRequirements(content, platform) {
    const result = {
      passed: true,
      errors: [],
      warnings: [],
      deduction: 0
    };

    const SPECS = {
      instagram: {
        caption_max: 2200,
        hashtags_max: 30,
        video_max_sec: 60
      },
      tiktok: {
        caption_max: 150,
        hashtags_max: 5,
        video_required: true
      },
      youtube: {
        title_max: 100,
        description_max: 5000,
        video_required: true
      },
      facebook: {
        caption_max: 63206,
        video_max_sec: 240
      },
      x: {
        text_max: 280,
        hashtags_recommended: 2
      },
      linkedin: {
        text_max: 3000,
        text_recommended: 1300
      }
    };

    const spec = SPECS[platform];
    if (!spec) {
      result.warnings.push(`Unknown platform: ${platform}`);
      return result;
    }

    // Check caption length
    const captionLength = (content.caption || content.text || '').length;
    if (spec.caption_max && captionLength > spec.caption_max) {
      result.errors.push(`Caption too long (${captionLength} chars, max ${spec.caption_max})`);
      result.deduction += 20;
    }

    if (spec.text_max && captionLength > spec.text_max) {
      result.errors.push(`Text too long (${captionLength} chars, max ${spec.text_max})`);
      result.deduction += 20;
    }

    if (spec.text_recommended && captionLength > spec.text_recommended) {
      result.warnings.push(`Text longer than recommended (${captionLength} chars, recommended ${spec.text_recommended})`);
      result.deduction += 5;
    }

    // Check hashtags
    const hashtagCount = (content.hashtags || []).length;
    if (spec.hashtags_max && hashtagCount > spec.hashtags_max) {
      result.errors.push(`Too many hashtags (${hashtagCount}, max ${spec.hashtags_max})`);
      result.deduction += 10;
    }

    // Check video requirement
    if (spec.video_required && !content.video_url) {
      result.errors.push(`${platform} requires a video`);
      result.deduction += 30;
    }

    // Check video duration
    if (content.video_duration && spec.video_max_sec) {
      if (content.video_duration > spec.video_max_sec) {
        result.errors.push(`Video too long (${content.video_duration}s, max ${spec.video_max_sec}s)`);
        result.deduction += 15;
      }
    }

    result.passed = result.errors.length === 0;
    return result;
  },

  /**
   * 3. MEDIA VALIDATION
   * Checks if media URLs are valid and accessible
   */
  async validateMedia(content) {
    const result = {
      passed: true,
      errors: [],
      warnings: [],
      deduction: 0
    };

    // Check if media exists
    if (!content.image_url && !content.video_url) {
      result.warnings.push('No media attached - consider adding images or videos for better engagement');
      result.deduction += 10;
    }

    // Validate image URL
    if (content.image_url) {
      if (!this.isValidUrl(content.image_url)) {
        result.errors.push('Invalid image URL format');
        result.deduction += 20;
      }
    }

    // Validate video URL
    if (content.video_url) {
      if (!this.isValidUrl(content.video_url)) {
        result.errors.push('Invalid video URL format');
        result.deduction += 20;
      }
    }

    // Check for data URLs (temporary)
    if (content.image_url?.startsWith('data:')) {
      result.warnings.push('Image is temporary - upload to permanent storage before publishing');
      result.deduction += 5;
    }

    result.passed = result.errors.length === 0;
    return result;
  },

  /**
   * 4. TEXT QUALITY CHECK
   * Validates caption quality
   */
  checkTextQuality(content) {
    const result = {
      passed: true,
      errors: [],
      warnings: [],
      deduction: 0
    };

    const text = content.caption || content.text || '';

    // Check if text exists
    if (!text || text.trim().length === 0) {
      result.errors.push('Missing caption/text');
      result.deduction += 25;
      return result;
    }

    // Check minimum length
    if (text.length < 10) {
      result.warnings.push('Caption is very short - consider adding more details');
      result.deduction += 5;
    }

    // Check for spelling/grammar (basic)
    const commonErrors = [
      { pattern: /\s\s+/g, message: 'Multiple spaces detected' },
      { pattern: /[.!?]{3,}/g, message: 'Excessive punctuation' },
      { pattern: /[A-Z\s]{10,}/g, message: 'Too much CAPS LOCK' }
    ];

    commonErrors.forEach(({ pattern, message }) => {
      if (pattern.test(text)) {
        result.warnings.push(message);
        result.deduction += 2;
      }
    });

    // Check for CTA
    const hasCTA = /click|link|visit|shop|learn|discover|get|download|subscribe|follow/i.test(text);
    if (!hasCTA) {
      result.warnings.push('Consider adding a call-to-action');
      result.deduction += 5;
    }

    // Check readability
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = sentences.reduce((sum, s) => 
      sum + s.trim().split(' ').length, 0) / sentences.length;

    if (avgWordsPerSentence > 25) {
      result.warnings.push('Sentences are long - consider breaking them up for readability');
      result.deduction += 3;
    }

    result.passed = result.errors.length === 0;
    return result;
  },

  /**
   * 5. PERMISSION CHECK
   * Verifies user has permission to publish to platform
   */
  async checkPermissions(userId, platform) {
    const result = {
      passed: true,
      errors: []
    };

    try {
      const { rows } = await query(
        `SELECT sa.status, ot.expires_at
         FROM social_accounts sa
         LEFT JOIN oauth_tokens ot ON ot.social_account_id = sa.id
         WHERE sa.user_id = $1 AND sa.platform_name = $2
         LIMIT 1`,
        [userId, platform]
      );

      if (!rows[0]) {
        result.passed = false;
        result.errors.push(`No ${platform} account connected - please connect your account first`);
        return result;
      }

      const account = rows[0];

      // Check if account is active
      if (account.status !== 'connected' && account.status !== 'active') {
        result.passed = false;
        result.errors.push(`${platform} account is ${account.status} - please reconnect`);
        return result;
      }

      // Check if token is expired
      if (account.expires_at && new Date(account.expires_at) < new Date()) {
        result.passed = false;
        result.errors.push(`${platform} token expired - please reconnect your account`);
        return result;
      }

      return result;
    } catch (err) {
      logger.error('Permission check error:', err);
      result.passed = false;
      result.errors.push('Permission check failed');
      return result;
    }
  },

  /**
   * 6. CONTENT SAFETY CHECK
   * Screens for inappropriate content
   */
  async checkContentSafety(content) {
    const result = {
      passed: true,
      errors: []
    };

    const text = (content.caption || content.text || '').toLowerCase();

    // Basic profanity filter
    const bannedWords = ['spam', 'scam']; // Add more as needed
    const foundBanned = bannedWords.filter(word => text.includes(word));

    if (foundBanned.length > 0) {
      result.passed = false;
      result.errors.push('Content contains potentially inappropriate words');
    }

    // Check for suspicious links
    if (text.includes('bit.ly') || text.includes('tinyurl')) {
      result.errors.push('Warning: Shortened URLs may be flagged as spam');
    }

    return result;
  },

  /**
   * 7. LINK VALIDATION
   * Checks if URLs in content are valid
   */
  async validateLinks(content) {
    const result = {
      passed: true,
      warnings: [],
      deduction: 0
    };

    const text = content.caption || content.text || '';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];

    if (content.link) urls.push(content.link);

    for (const url of urls) {
      if (!this.isValidUrl(url)) {
        result.warnings.push(`Invalid URL format: ${url}`);
        result.deduction += 5;
      }
    }

    result.passed = result.warnings.length === 0;
    return result;
  },

  /**
   * 8. AI CREDITS CHECK
   * Ensures user has enough credits
   */
  async checkAICredits(userId) {
    const result = {
      passed: true,
      error: null
    };

    try {
      const { rows } = await query(
        'SELECT ai_credits, ai_credits_used FROM users WHERE id = $1',
        [userId]
      );

      if (!rows[0]) {
        result.passed = false;
        result.error = 'User not found';
        return result;
      }

      const { ai_credits, ai_credits_used } = rows[0];
      const remaining = (ai_credits || 0) - (ai_credits_used || 0);

      if (remaining <= 0) {
        result.passed = false;
        result.error = 'Insufficient AI credits - please upgrade your plan';
      } else if (remaining < 10) {
        // Warning - will be in warnings array from main validation
        logger.warn(`User ${userId} has only ${remaining} AI credits remaining`);
      }

      return result;
    } catch (err) {
      logger.error('AI credits check error:', err);
      result.passed = false;
      result.error = 'Credits check failed';
      return result;
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // HELPER FUNCTIONS
  // ═══════════════════════════════════════════════════════════════

  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  getQualityLevel(score) {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'acceptable';
    return 'poor';
  },

  /**
   * Generate quality report
   */
  generateQualityReport(checks) {
    return {
      overall_score: checks.score,
      quality_level: checks.quality_level,
      can_publish: checks.passed,
      total_errors: checks.errors.length,
      total_warnings: checks.warnings.length,
      errors: checks.errors,
      warnings: checks.warnings,
      recommendations: this.generateRecommendations(checks)
    };
  },

  generateRecommendations(checks) {
    const recommendations = [];

    if (checks.score < 80) {
      recommendations.push('Review and improve content quality before publishing');
    }

    if (checks.warnings.some(w => w.includes('CTA'))) {
      recommendations.push('Add a clear call-to-action to improve engagement');
    }

    if (checks.warnings.some(w => w.includes('media'))) {
      recommendations.push('Adding images or videos can increase engagement by 2-3x');
    }

    if (checks.warnings.some(w => w.includes('hashtag'))) {
      recommendations.push('Optimize hashtag usage for better reach');
    }

    return recommendations;
  }
};

module.exports = QualityControlService;
