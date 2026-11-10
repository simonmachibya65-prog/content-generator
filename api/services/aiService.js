const OpenAI = require('openai');
const axios = require('axios');
const { query } = require('../database');
const logger = require('../utils/logger');

// Lazy OpenAI init — only if key is present
const getOpenAI = () => process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// ─── Universal text caller: Gemini first, OpenAI fallback ─────
async function callTextAI(messages, options = {}) {
  // 1. Try Gemini Flash (free)
  if (process.env.GOOGLE_GEMINI_API_KEY) {
    try {
      const model = options.pro ? 'gemini-pro-latest' : 'gemini-3.5-flash';
      const systemMsg = messages.find(m => m.role === 'system')?.content || '';
      const userMsg   = messages.filter(m => m.role !== 'system').map(m => `${m.role}: ${m.content}`).join('\n\n');
      const fullPrompt = options.json
        ? `${systemMsg}\n\n${userMsg}\n\nRespond ONLY with valid JSON.`
        : `${systemMsg}\n\n${userMsg}`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens || 2000,
            responseMimeType: options.json ? 'application/json' : 'text/plain'
          }
        },
        { timeout: 30000 }
      );
      let text = response.data.candidates[0].content.parts[0].text;
      // Strip code fences Gemini sometimes adds
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      return text;
    } catch (err) {
      logger.warn('Gemini failed, falling back to OpenAI:', err.message);
    }
  }
  // 2. OpenAI fallback
  const openai = getOpenAI();
  if (!openai) throw new Error('No AI provider configured. Add GOOGLE_GEMINI_API_KEY or OPENAI_API_KEY to .env');
  const response = await openai.chat.completions.create({
    model: options.model || 'gpt-4o',
    messages,
    response_format: options.json ? { type: 'json_object' } : undefined,
    temperature: options.temperature || 0.7,
    max_tokens: options.maxTokens || 2000
  });
  return response.choices[0].message.content;
}

// ─── Universal image caller: Stability AI first, DALL-E fallback
async function callImageAI(prompt, options = {}) {
  // 1. Stability AI SDXL (25 free/day)
  if (process.env.STABILITY_API_KEY) {
    try {
      const sizeMap = { '1024x1024': [1024,1024], '1024x1792': [832,1216], '1792x1024': [1216,832] };
      const [w, h] = sizeMap[options.size] || [1024, 1024];
      const response = await axios.post(
        'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
        {
          text_prompts: [
            { text: prompt, weight: 1 },
            { text: 'blurry, low quality, distorted, watermark, ugly', weight: -1 }
          ],
          cfg_scale: 7, height: h, width: w, steps: 30, samples: 1,
          style_preset: options.stylePreset || 'photographic'
        },
        {
          headers: { Authorization: `Bearer ${process.env.STABILITY_API_KEY}`, Accept: 'application/json' },
          timeout: 60000
        }
      );
      return {
        url: `data:image/png;base64,${response.data.artifacts[0].base64}`,
        provider: 'stability'
      };
    } catch (err) {
      logger.warn('Stability AI failed, trying DALL-E:', err.message);
    }
  }
  // 2. OpenAI DALL-E 3 fallback
  const openai = getOpenAI();
  if (openai) {
    const response = await openai.images.generate({
      model: 'dall-e-3', prompt, n: 1,
      size: options.size || '1024x1024',
      quality: options.quality || 'standard'
    });
    return { url: response.data[0].url, provider: 'openai' };
  }
  throw new Error('No image provider. Add STABILITY_API_KEY or OPENAI_API_KEY to .env');
}

const PLATFORM_LIMITS = {
  tiktok:    { caption: 2200, hashtags: 30 },
  youtube:   { title: 100, description: 5000, tags: 500 },
  x:         { text: 280, hashtags: 3 },
  instagram: { caption: 2200, hashtags: 30 },
  facebook:  { text: 63206, hashtags: 10 },
  linkedin:  { text: 3000, hashtags: 5 }
};

const AIService = {

  async generateTextContent({ userId, topic, platforms, tone, language, brandVoice, targetAudience }) {
    const platformNames = platforms.join(', ');
    const systemPrompt = `You are a professional social media content creator.
Create engaging content optimized for each platform's unique style, audience, and character limits.
${brandVoice ? `Brand voice: ${brandVoice}` : ''}
${targetAudience ? `Target audience: ${targetAudience}` : ''}
Always respond in ${language === 'sw' ? 'Swahili' : language === 'fr' ? 'French' : 'English'}.
Tone: ${tone || 'professional'}.`;

    const userPrompt = `Create social media posts about: "${topic}" for: ${platformNames}
Return JSON only: { "tiktok": {"caption":"...","hashtags":[]}, "youtube": {"title":"...","description":"...","tags":[]}, "x": {"text":"..."}, "instagram": {"caption":"...","hashtags":[]}, "facebook": {"message":"..."}, "linkedin": {"text":"..."} }
Only include requested platforms. Follow character limits.`;

    const raw = await callTextAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { json: true, temperature: 0.7 });

    await query('UPDATE users SET ai_credits_used = ai_credits_used + 1 WHERE id = $1', [userId]);
    logger.info('AI content generated', { userId, platforms });
    return JSON.parse(raw);
  },

  async generateHashtags({ topic, platform, count = 15 }) {
    const actual = Math.min(count, PLATFORM_LIMITS[platform]?.hashtags || 15);
    const raw = await callTextAI([{
      role: 'user',
      content: `Generate ${actual} trending hashtags for ${platform} about: "${topic}". Return JSON array of strings without #. Example: ["trending","viral"]`
    }], { json: true, temperature: 0.8 });
    return JSON.parse(raw);
  },

  async generateVideoScript({ userId, topic, platform, duration, tone, language }) {
    const durationMap = { '15s':'15 seconds', '30s':'30 seconds', '60s':'1 minute', '3m':'3 minutes', '10m':'10 minutes' };
    const raw = await callTextAI([
      { role: 'system', content: `You are a professional ${platform} video script writer. Write engaging, hook-driven scripts.` },
      { role: 'user', content: `Write a ${durationMap[duration]||'60 second'} video script for ${platform} about: "${topic}". Tone: ${tone||'engaging'}. Language: ${language||'en'}.
Return JSON: {"hook":"...","intro":"...","main_content":"...","call_to_action":"...","full_script":"...","suggested_visuals":[],"suggested_music":"..."}` }
    ], { json: true, temperature: 0.75 });
    await query('UPDATE users SET ai_credits_used = ai_credits_used + 2 WHERE id = $1', [userId]);
    return JSON.parse(raw);
  },

  async repurposeContent({ userId, originalContent, sourceFormat, targetPlatforms, tone }) {
    const raw = await callTextAI([
      { role: 'system', content: 'You are a content repurposing expert. Transform content into platform-optimized formats.' },
      { role: 'user', content: `Repurpose this ${sourceFormat} content for: ${targetPlatforms.join(', ')}.\nContent:\n${originalContent}\nTone: ${tone||'match original'}.\nReturn JSON with optimized content for each platform.` }
    ], { json: true, temperature: 0.7 });
    await query('UPDATE users SET ai_credits_used = ai_credits_used + 2 WHERE id = $1', [userId]);
    return JSON.parse(raw);
  },

  async generateImagePrompt({ topic, platform, style }) {
    const raw = await callTextAI([{
      role: 'user',
      content: `Create a detailed image generation prompt for a ${platform} post about: "${topic}". Style: ${style||'professional, eye-catching'}.
Return JSON: {"prompt":"...","negative_prompt":"...","style":"..."}`
    }], { json: true, temperature: 0.8 });
    return JSON.parse(raw);
  },

  async generateImage({ userId, prompt, size = '1024x1024' }) {
    const result = await callImageAI(prompt, { size });
    await query('UPDATE users SET ai_credits_used = ai_credits_used + 3 WHERE id = $1', [userId]);
    return result;
  },

  async generateCarousel({ userId, topic, slides, platform, tone }) {
    const raw = await callTextAI([
      { role: 'system', content: 'You are a social media carousel content expert.' },
      { role: 'user', content: `Create a ${slides}-slide ${platform||'Instagram'} carousel about: "${topic}". Tone: ${tone||'Educational'}.
Return JSON: {"title":"...","hook":"...","slides":[{"slide":1,"title":"...","body":"...","visual_note":"..."}],"cta_slide":"...","caption":"...","hashtags":[]}` }
    ], { json: true, temperature: 0.75 });
    await query('UPDATE users SET ai_credits_used = ai_credits_used + 2 WHERE id = $1', [userId]);
    return JSON.parse(raw);
  },

  async generateAdCopy({ userId, product, goal, platform, tone }) {
    const raw = await callTextAI([
      { role: 'system', content: 'You are a professional copywriter specializing in high-converting social media ads.' },
      { role: 'user', content: `Write compelling ad copy for ${platform||'Instagram'}. Product: ${product}. Goal: ${goal||'sales'}. Tone: ${tone||'Persuasive'}.
Return JSON: {"headline":"...","subheadline":"...","body_copy":"...","cta":"...","variations":[{"version":"A","headline":"...","body":"...","angle":"..."},{"version":"B","headline":"...","body":"...","angle":"..."}],"text":"...","estimated_ctr":"...","target_audience":"..."}` }
    ], { json: true, temperature: 0.8 });
    await query('UPDATE users SET ai_credits_used = ai_credits_used + 2 WHERE id = $1', [userId]);
    return JSON.parse(raw);
  },

  async marketingChat({ messages, businessContext }) {
    const systemPrompt = `You are an expert AI Marketing Assistant for a social media management platform.
Help with: marketing strategies, content ideas, social media best practices, analytics, hashtags, platform recommendations.
${businessContext ? `Business context: ${JSON.stringify(businessContext)}` : ''}
Be concise, practical, action-oriented. Use bullet points.`;
    return await callTextAI(
      [{ role: 'system', content: systemPrompt }, ...messages],
      { temperature: 0.7, maxTokens: 1000 }
    );
  },

  async generateBrandIntelligence(profile) {
    const raw = await callTextAI([
      { role: 'system', content: 'You are a brand strategist. Analyze business profiles and create comprehensive brand intelligence documents.' },
      { role: 'user', content: `Analyze and create brand intelligence for:
Business: ${profile.business_name}, Industry: ${profile.industry}
Products: ${profile.products||'N/A'}, Services: ${profile.services||'N/A'}
Audience: ${JSON.stringify(profile.target_audience)}, Location: ${profile.target_location}
Goals: ${JSON.stringify(profile.marketing_goals)}, Description: ${profile.business_description||'N/A'}

Return JSON with: brand_identity, brand_voice, tone_guidelines, content_themes, target_personas, visual_guidelines, marketing_strategy, content_pillars, posting_strategy` }
    ], { json: true, temperature: 0.7, maxTokens: 3000, pro: true });
    return JSON.parse(raw);
  },

  async generateMarketingStrategy({ profile, months, connectedPlatforms, campaignGoals }) {
    const raw = await callTextAI([
      { role: 'system', content: 'You are a digital marketing strategist. Create comprehensive, actionable marketing strategies.' },
      { role: 'user', content: `Create a ${months}-month strategy for ${profile.business_name} (${profile.industry}).
Platforms: ${connectedPlatforms.join(', ')}. Goals: ${campaignGoals?.join(', ')||'awareness, engagement, sales'}.
Audience: ${JSON.stringify(profile.target_audience)}. Location: ${profile.target_location}.
Return JSON with: summary, objectives, target_platforms, content_strategy, posting_frequency, monthly_breakdown, kpis, budget_allocation` }
    ], { json: true, temperature: 0.7, maxTokens: 3000, pro: true });
    return JSON.parse(raw);
  },

  async generateContentIdeas({ profile, brandIntelligence, platform, count = 10, timeframe = 30 }) {
    const raw = await callTextAI([{
      role: 'user',
      content: `Generate ${count} content ideas for ${platform} for ${profile.business_name} (${profile.industry}).
Products: ${profile.products||profile.services}. Audience: ${JSON.stringify(profile.target_audience)}.
Brand voice: ${brandIntelligence?.brand_voice||'Professional'}. Timeframe: ${timeframe} days.
Return JSON: {"ideas":[{"title":"...","description":"...","content_type":"...","best_day":"...","best_time":"...","estimated_engagement":"...","hashtags":[],"hook":"..."}]}`
    }], { json: true, temperature: 0.85 });
    return JSON.parse(raw);
  },

  getBestPostingTimes(platform) {
    const times = {
      tiktok:    ['07:00', '12:00', '19:00', '21:00'],
      youtube:   ['09:00', '15:00', '17:00'],
      x:         ['08:00', '12:00', '17:00', '20:00'],
      instagram: ['07:00', '11:00', '17:00', '19:00'],
      facebook:  ['09:00', '13:00', '16:00'],
      linkedin:  ['08:00', '12:00', '17:00']
    };
    return times[platform] || ['09:00', '17:00'];
  }
};

module.exports = AIService;
