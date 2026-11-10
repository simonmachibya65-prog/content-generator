const OpenAI = require('openai');
const axios = require('axios');
const { query } = require('../database');
const logger = require('../utils/logger');

// ─── Provider instances (lazy — only created if key exists) ───
const getOpenAI = () => process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// ─── Model Router ─────────────────────────────────────────────
const ModelRouter = {

  // ── TEXT: Gemini Flash (free) → GPT-4o fallback ─────────────
  async text(prompt, systemPrompt, options = {}) {
    // 1. Try Google Gemini first (free tier: 15 req/min, 1M tokens/day)
    if (process.env.GOOGLE_GEMINI_API_KEY) {
      try {
        return await this.geminiText(prompt, systemPrompt, options);
      } catch (err) {
        logger.warn('Gemini text failed, falling back to OpenAI:', err.message);
      }
    }
    // 2. OpenAI fallback
    const openai = getOpenAI();
    if (openai) {
      const response = await openai.chat.completions.create({
        model: options.model || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        response_format: options.json ? { type: 'json_object' } : undefined,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000
      });
      return response.choices[0].message.content;
    }
    throw new Error('No text provider available. Add GOOGLE_GEMINI_API_KEY or OPENAI_API_KEY to .env');
  },

  async geminiText(prompt, systemPrompt, options = {}) {
    const model = options.fast ? 'gemini-3.5-flash' : 'gemini-pro-latest';
    const fullPrompt = options.json
      ? `${systemPrompt}\n\n${prompt}\n\nIMPORTANT: Respond ONLY with valid JSON.`
      : `${systemPrompt}\n\n${prompt}`;

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

    const text = response.data.candidates[0].content.parts[0].text;
    // Strip markdown code fences if Gemini wraps JSON in them
    return text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  },

  // ── IMAGE: Stability AI SDXL (free 25/day) → DALL-E fallback ─
  async image(prompt, options = {}) {
    // 1. Stability AI (25 free images/day, resets daily)
    if (process.env.STABILITY_API_KEY) {
      try {
        return await this.stabilityImage(prompt, options);
      } catch (err) {
        logger.warn('Stability AI failed, trying DALL-E:', err.message);
      }
    }
    // 2. Gemini Imagen fallback
    if (process.env.GOOGLE_GEMINI_API_KEY) {
      try {
        return await this.geminiImage(prompt, options);
      } catch (err) {
        logger.warn('Gemini Imagen failed, trying DALL-E:', err.message);
      }
    }
    // 3. OpenAI DALL-E 3 fallback
    const openai = getOpenAI();
    if (openai) {
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: options.size || '1024x1024',
        quality: options.quality || 'standard',
        style: options.style || 'vivid'
      });
      return {
        url: response.data[0].url,
        revised_prompt: response.data[0].revised_prompt,
        provider: 'openai'
      };
    }
    throw new Error('No image provider available. Add STABILITY_API_KEY, GOOGLE_GEMINI_API_KEY or OPENAI_API_KEY to .env');
  },

  async stabilityImage(prompt, options = {}) {
    // Map size to Stability AI dimensions
    const sizeMap = {
      '1024x1024': { width: 1024, height: 1024 },
      '1024x1792': { width: 832, height: 1216 },  // portrait
      '1792x1024': { width: 1216, height: 832 },  // landscape
    };
    const dims = sizeMap[options.size] || { width: 1024, height: 1024 };

    const response = await axios.post(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
      {
        text_prompts: [
          { text: prompt, weight: 1 },
          { text: 'blurry, low quality, distorted, watermark, text', weight: -1 }
        ],
        cfg_scale: 7,
        height: dims.height,
        width: dims.width,
        steps: 30,
        samples: 1,
        style_preset: options.stylePreset || 'photographic'
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        timeout: 60000
      }
    );

    const b64 = response.data.artifacts[0].base64;
    // Return as data URL (works without S3)
    return {
      url: `data:image/png;base64,${b64}`,
      provider: 'stability',
      model: 'sdxl-1.0'
    };
  },

  async geminiImage(prompt, options = {}) {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
      {
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: options.aspectRatio || '1:1'
        }
      },
      { timeout: 60000 }
    );
    const b64 = response.data.predictions[0].bytesBase64Encoded;
    return { url: `data:image/png;base64,${b64}`, provider: 'gemini-imagen' };
  },

  // ── VIDEO: Kling AI (66 free credits/day) → Runway fallback ──
  async video(prompt, options = {}) {
    // 1. Kling AI (best free tier — 66 credits/day)
    if (process.env.KLING_API_KEY) {
      try {
        return await this.klingVideo(prompt, options);
      } catch (err) {
        logger.warn('Kling AI failed, trying Runway:', err.message);
      }
    }
    // 2. Runway ML fallback
    if (process.env.RUNWAY_API_KEY) {
      try {
        return await this.runwayVideo(prompt, options);
      } catch (err) {
        logger.warn('Runway failed, trying Veo:', err.message);
      }
    }
    // 3. Google Veo fallback (paid)
    if (process.env.GOOGLE_VEO_API_KEY || process.env.GOOGLE_CLOUD_PROJECT) {
      try {
        return await this.veoVideo(prompt, options);
      } catch (err) {
        logger.warn('Veo failed:', err.message);
      }
    }
    // No provider — return placeholder so rest of production continues
    logger.warn('No video provider configured — returning placeholder');
    return {
      url: null,
      placeholder: true,
      message: 'Add KLING_API_KEY or RUNWAY_API_KEY to enable video generation',
      provider: 'none',
      status: 'placeholder'
    };
  },

  async klingVideo(prompt, options = {}) {
    const response = await axios.post(
      'https://api.klingai.com/v1/videos/text2video',
      {
        model_name: 'kling-v1',
        prompt,
        negative_prompt: 'blurry, low quality, distorted, watermark',
        cfg_scale: 0.5,
        mode: options.quality === 'high' ? 'pro' : 'std',
        duration: String(Math.min(options.duration || 5, 10)),
        aspect_ratio: options.aspectRatio === '16:9' ? '16:9' : '9:16'
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.KLING_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    return {
      taskId: response.data.data?.task_id,
      provider: 'kling',
      status: 'processing',
      pollUrl: `https://api.klingai.com/v1/videos/text2video/${response.data.data?.task_id}`
    };
  },

  async runwayVideo(prompt, options = {}) {
    const response = await axios.post(
      'https://api.dev.runwayml.com/v1/image_to_video',
      {
        promptText: prompt,
        model: 'gen3a_turbo',
        duration: options.duration || 5,
        ratio: options.aspectRatio === '9:16' ? '768:1280' : '1280:768'
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.RUNWAY_API_KEY}`,
          'X-Runway-Version': '2024-11-06',
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    return { taskId: response.data.id, provider: 'runway', status: 'processing' };
  },

  async veoVideo(prompt, options = {}) {
    const response = await axios.post(
      `https://us-central1-aiplatform.googleapis.com/v1/projects/${process.env.GOOGLE_CLOUD_PROJECT}/locations/us-central1/publishers/google/models/veo-2.0-generate-001:predictLongRunning`,
      {
        instances: [{ prompt }],
        parameters: {
          aspectRatio: options.aspectRatio || '9:16',
          durationSeconds: Math.min(options.duration || 5, 8),
          sampleCount: 1
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GOOGLE_VEO_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    return { operationName: response.data.name, provider: 'veo', status: 'processing' };
  },

  // ── VOICE: ElevenLabs (10k chars/mo free) → OpenAI TTS fallback
  async voice(text, options = {}) {
    // 1. ElevenLabs (best quality, multilingual, free 10k/mo)
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        return await this.elevenLabsVoice(text, options);
      } catch (err) {
        logger.warn('ElevenLabs failed, using OpenAI TTS:', err.message);
      }
    }
    // 2. Google TTS fallback (1M chars/mo free)
    if (process.env.GOOGLE_GEMINI_API_KEY) {
      try {
        return await this.googleTTS(text, options);
      } catch (err) {
        logger.warn('Google TTS failed, using OpenAI TTS:', err.message);
      }
    }
    // 3. OpenAI TTS fallback
    const openai = getOpenAI();
    if (openai) {
      const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: options.voice || 'alloy',
        input: text,
        speed: options.speed || 1.0
      });
      const buffer = Buffer.from(await response.arrayBuffer());
      return { buffer, format: 'mp3', provider: 'openai-tts' };
    }
    throw new Error('No voice provider available. Add ELEVENLABS_API_KEY or OPENAI_API_KEY to .env');
  },

  async elevenLabsVoice(text, options = {}) {
    const VOICE_IDS = {
      'male_professional':   '21m00Tcm4TlvDq8ikWAM',
      'female_professional': 'EXAVITQu4vr4xnSDxMaL',
      'male_friendly':       'TxGEqnHWrfWFTfGW9XjX',
      'female_friendly':     'jsCqWAovK2LkecY7zXl4',
      // Swahili-capable voice
      'swahili':             'pNInz6obpgDQGcFmaJgB'
    };
    const voiceId = VOICE_IDS[options.voice] || VOICE_IDS['female_professional'];
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
        model_id: 'eleven_turbo_v2_5', // supports 32 languages incl. Swahili
        voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: options.speed || 1.0 }
      },
      {
        headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
        responseType: 'arraybuffer',
        timeout: 30000
      }
    );
    return { buffer: Buffer.from(response.data), format: 'mp3', provider: 'elevenlabs' };
  },

  async googleTTS(text, options = {}) {
    // Google Cloud TTS — 1M standard chars/mo free
    const langCode = options.language === 'sw' ? 'sw-KE' : options.language === 'fr' ? 'fr-FR' : 'en-US';
    const response = await axios.post(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
      {
        input: { text },
        voice: { languageCode: langCode, ssmlGender: options.gender === 'male' ? 'MALE' : 'FEMALE' },
        audioConfig: { audioEncoding: 'MP3', speakingRate: options.speed || 1.0 }
      },
      { timeout: 30000 }
    );
    const buffer = Buffer.from(response.data.audioContent, 'base64');
    return { buffer, format: 'mp3', provider: 'google-tts' };
  }
};

// ─── Creative Studio Service ──────────────────────────────────
const CreativeStudioService = {
  /**
   * STEP 3: Generate creative brief from project info
   */
  async generateCreativeBrief(project) {
    const systemPrompt = `You are a world-class marketing director and creative strategist.
Create comprehensive, professional creative briefs for advertising campaigns.
Be specific, actionable and commercially focused.`;

    const userPrompt = `Create a complete creative brief and production plan for:

Business: ${project.business_name}
Product/Service: ${project.product_service}
Description: ${project.description}
Objective: ${project.objective}
Target Audience: ${project.target_audience}
Country: ${project.country}
Language: ${project.language}
Platforms: ${(project.platforms || []).join(', ')}
Ad Duration: ${project.ad_duration || 30} seconds
Special Instructions: ${project.special_instructions || 'None'}

Return a JSON creative brief with EXACTLY this structure:
{
  "objective": "Clear advertising objective",
  "target_audience": "Specific audience description",
  "key_message": "Single most important message",
  "creative_concept": "The big idea for the campaign",
  "headline": "Main ad headline (punchy, memorable)",
  "tagline": "Brand tagline",
  "cta": "Call to action text",
  "image_prompt": "Detailed DALL-E prompt for hero image",
  "image_style": "photorealistic/illustration/minimalist/vibrant",
  "video_script": "Full narration script for ${project.ad_duration || 30}-second video",
  "video_scenes": [
    {
      "scene": 1,
      "duration": 5,
      "description": "What happens in this scene",
      "visual": "Detailed visual description for AI video generation",
      "text_overlay": "Any text to show on screen",
      "voiceover": "What narrator says in this scene"
    }
  ],
  "voiceover_script": "Complete voiceover narration text",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "platform_notes": {
    "instagram": "Instagram-specific caption and notes",
    "tiktok": "TikTok-specific notes",
    "youtube": "YouTube title and description",
    "facebook": "Facebook post text"
  },
  "captions": {
    "instagram": "Instagram caption",
    "tiktok": "TikTok caption",
    "facebook": "Facebook caption",
    "x": "X/Twitter caption",
    "linkedin": "LinkedIn caption"
  }
}`;

    const content = await ModelRouter.text(userPrompt, systemPrompt, { json: true, maxTokens: 3000 });
    return JSON.parse(content);
  },

  /**
   * STEP 4: Generate all text content
   */
  async generateTextAssets(project, brief) {
    const systemPrompt = `You are a professional copywriter. Generate complete marketing copy in ${project.language}.
${project.language === 'sw' ? 'Write primarily in Swahili with English where appropriate.' : ''}`;

    const content = await ModelRouter.text(`
Generate comprehensive marketing copy for "${project.product_service}" by "${project.business_name}".

Creative Brief Summary:
- Objective: ${brief.objective}
- Key Message: ${brief.key_message}
- Target Audience: ${brief.target_audience}
- Tone: Professional, persuasive, clear

Return JSON:
{
  "headlines": ["headline 1", "headline 2", "headline 3"],
  "subheadlines": ["subheadline 1", "subheadline 2"],
  "body_copy": "Main advertising body text (2-3 paragraphs)",
  "captions": {
    "instagram": "Engaging IG caption with emojis",
    "tiktok": "Punchy TikTok caption",
    "facebook": "Facebook post text",
    "linkedin": "Professional LinkedIn post",
    "x": "Tweet under 280 chars"
  },
  "product_description": "Compelling product/service description",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "cta_variations": ["CTA 1", "CTA 2", "CTA 3"],
  "voiceover_script": "${brief.voiceover_script || 'Professional narration script'}",
  "video_script": "${brief.video_script || 'Full video script'}",
  "ad_copy_variations": [
    {"version": "A", "headline": "...", "body": "...", "cta": "..."},
    {"version": "B", "headline": "...", "body": "...", "cta": "..."}
  ]
}`, systemPrompt, { json: true, maxTokens: 2500 });

    return JSON.parse(content);
  },

  /**
   * STEP 5: Generate images
   */
  async generateImageAssets(project, brief) {
    const results = [];
    const imageTypes = [
      { subtype: 'hero', prompt: `${brief.image_prompt} - hero image, ${brief.image_style} style`, size: '1024x1024' },
      { subtype: 'poster', prompt: `Professional advertising poster for ${project.product_service}. ${brief.creative_concept}. Brand colors. High quality print-ready.`, size: '1024x1792' },
      { subtype: 'square', prompt: `${brief.image_prompt} - square format for Instagram`, size: '1024x1024' },
      { subtype: 'banner', prompt: `Professional banner advertisement for ${project.product_service}. Wide format. ${brief.headline}.`, size: '1792x1024' }
    ];

    for (const imgType of imageTypes) {
      try {
        const result = await ModelRouter.image(imgType.prompt, { size: imgType.size, quality: 'hd' });
        results.push({ ...imgType, ...result, status: 'ready' });
      } catch (err) {
        logger.error(`Image generation failed for ${imgType.subtype}:`, err.message);
        results.push({ ...imgType, status: 'failed', error: err.message });
      }
    }
    return results;
  },

  /**
   * STEP 6: Generate video scenes
   */
  async generateVideoScenes(project, brief) {
    const scenes = brief.video_scenes || [];
    const results = [];

    for (const scene of scenes) {
      try {
        const result = await ModelRouter.video(
          `${scene.visual}. ${scene.description}. Professional advertising style. High quality.`,
          {
            duration: scene.duration || 5,
            aspectRatio: project.platforms?.includes('tiktok') ? '9:16' : '16:9'
          }
        );
        results.push({ scene: scene.scene, ...result, description: scene.description, status: result.placeholder ? 'placeholder' : 'processing' });
      } catch (err) {
        logger.error(`Video scene ${scene.scene} failed:`, err.message);
        results.push({ scene: scene.scene, status: 'failed', error: err.message });
      }
    }
    return results;
  },

  /**
   * STEP 7: Generate voiceover
   */
  async generateVoiceover(project, brief, options = {}) {
    const script = brief.voiceover_script || brief.video_script;
    if (!script) return null;

    try {
      const result = await ModelRouter.voice(script, {
        voice: options.voice || (options.gender === 'male' ? 'male_professional' : 'female_professional'),
        speed: options.speed || 1.0,
        language: project.language
      });

      return {
        script,
        buffer: result.buffer,
        format: result.format,
        provider: result.provider,
        duration: script.length / 15, // rough estimate
        status: 'ready'
      };
    } catch (err) {
      logger.error('Voiceover generation failed:', err.message);
      return { status: 'failed', error: err.message };
    }
  },

  /**
   * Generate platform-specific versions of content
   */
  async generatePlatformVersions(project, brief, assets) {
    const platforms = project.platforms || ['instagram', 'tiktok', 'youtube', 'facebook'];
    const PLATFORM_SPECS = {
      instagram: [
        { format: 'reel', aspect_ratio: '9:16', resolution: '1080x1920', duration: 30 },
        { format: 'post', aspect_ratio: '1:1', resolution: '1080x1080', duration: null },
        { format: 'story', aspect_ratio: '9:16', resolution: '1080x1920', duration: 15 }
      ],
      tiktok: [
        { format: 'video', aspect_ratio: '9:16', resolution: '1080x1920', duration: 30 }
      ],
      youtube: [
        { format: 'short', aspect_ratio: '9:16', resolution: '1080x1920', duration: 60 },
        { format: 'video', aspect_ratio: '16:9', resolution: '1920x1080', duration: 30 }
      ],
      facebook: [
        { format: 'video', aspect_ratio: '16:9', resolution: '1280x720', duration: 30 },
        { format: 'story', aspect_ratio: '9:16', resolution: '1080x1920', duration: 15 }
      ],
      x: [
        { format: 'post', aspect_ratio: '16:9', resolution: '1280x720', duration: 30 }
      ],
      linkedin: [
        { format: 'post', aspect_ratio: '1:1', resolution: '1080x1080', duration: null }
      ]
    };

    const versions = [];
    for (const platform of platforms) {
      const specs = PLATFORM_SPECS[platform] || [];
      for (const spec of specs.slice(0, 2)) { // first 2 formats per platform
        versions.push({
          platform,
          ...spec,
          caption: brief.captions?.[platform] || brief.key_message,
          hashtags: brief.hashtags || [],
          status: 'generating'
        });
      }
    }
    return versions;
  },

  /**
   * FULL PRODUCTION: One-click complete advertisement
   */
  async runFullProduction(projectId, userId) {
    logger.info(`Starting full production for project ${projectId}`);

    // Update status
    await this.updateProjectStatus(projectId, 'planning', 5, 'Planning creative strategy...');

    // Get project
    const { rows } = await query('SELECT * FROM creative_projects WHERE id = $1', [projectId]);
    const project = rows[0];
    if (!project) throw new Error('Project not found');

    let creditsUsed = 0;

    try {
      // STEP 3: Generate creative brief
      logger.info(`[${projectId}] Generating creative brief`);
      await this.updateProjectStatus(projectId, 'planning', 10, 'AI analyzing your brief...');
      const brief = await this.generateCreativeBrief(project);
      creditsUsed += 5;

      // Save brief to DB
      await query(
        `INSERT INTO creative_briefs (project_id, objective, target_audience, key_message,
          creative_concept, headline, tagline, cta, image_prompt, image_style,
          video_script, video_scenes, voiceover_script, platform_notes, hashtags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (project_id) DO UPDATE SET
           objective=$2, target_audience=$3, key_message=$4, creative_concept=$5,
           headline=$6, tagline=$7, cta=$8, image_prompt=$9, image_style=$10,
           video_script=$11, video_scenes=$12, voiceover_script=$13, platform_notes=$14,
           hashtags=$15`,
        [
          projectId, brief.objective, brief.target_audience, brief.key_message,
          brief.creative_concept, brief.headline, brief.tagline, brief.cta,
          brief.image_prompt, brief.image_style,
          brief.video_script, JSON.stringify(brief.video_scenes || []),
          brief.voiceover_script, JSON.stringify(brief.platform_notes || {}),
          brief.hashtags || []
        ]
      );

      // STEP 4: Generate text
      logger.info(`[${projectId}] Generating text content`);
      await this.updateProjectStatus(projectId, 'text', 20, 'Writing marketing copy...');
      const textAssets = await this.generateTextAssets(project, brief);
      creditsUsed += 2;

      // Save text assets
      await this.saveAsset(projectId, 'text', 'captions', textAssets.captions, null, 'openai');
      await this.saveAsset(projectId, 'text', 'headlines', JSON.stringify(textAssets.headlines), null, 'openai');
      await this.saveAsset(projectId, 'text', 'body_copy', textAssets.body_copy, null, 'openai');
      await this.saveAsset(projectId, 'text', 'hashtags', (textAssets.hashtags || []).join(' '), null, 'openai');

      // STEP 5: Generate images
      logger.info(`[${projectId}] Generating images`);
      await this.updateProjectStatus(projectId, 'images', 35, 'Generating promotional images...');
      const imageAssets = await this.generateImageAssets(project, brief);
      creditsUsed += 3 * imageAssets.filter(a => a.status === 'ready').length;

      for (const img of imageAssets) {
        await this.saveAsset(projectId, 'image', img.subtype, null, img.url, img.provider || 'openai', {
          prompt: img.prompt,
          size: img.size,
          status: img.status
        });
      }

      // STEP 6: Generate video scenes (if video category)
      if (['video_ad', 'product', 'business'].includes(project.category)) {
        logger.info(`[${projectId}] Generating video scenes`);
        await this.updateProjectStatus(projectId, 'video', 55, 'Generating video scenes...');
        const videoScenes = await this.generateVideoScenes(project, brief);
        creditsUsed += 5 * videoScenes.length;

        for (const scene of videoScenes) {
          await this.saveAsset(projectId, 'video_scene', `scene_${scene.scene}`, scene.description, scene.url, scene.provider, {
            taskId: scene.taskId,
            operationName: scene.operationName,
            status: scene.status
          });
        }
      }

      // STEP 7: Generate voiceover
      logger.info(`[${projectId}] Generating voiceover`);
      await this.updateProjectStatus(projectId, 'audio', 70, 'Recording voiceover...');
      // Voiceover needs file upload - save script only for now
      await this.saveAsset(projectId, 'voiceover', 'narration', brief.voiceover_script, null, 'elevenlabs');
      creditsUsed += 2;

      // STEP 8: Platform versions
      logger.info(`[${projectId}] Creating platform versions`);
      await this.updateProjectStatus(projectId, 'editing', 80, 'Adapting for platforms...');
      const versions = await this.generatePlatformVersions(project, brief, imageAssets);

      for (const v of versions) {
        await query(
          `INSERT INTO platform_versions (project_id, platform, format, aspect_ratio, resolution, caption, hashtags, duration, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'ready')`,
          [projectId, v.platform, v.format, v.aspect_ratio, v.resolution, v.caption, v.hashtags, v.duration]
        );
      }

      // Update credits
      await query('UPDATE users SET ai_credits_used = ai_credits_used + $1 WHERE id = $2', [creditsUsed, userId]);
      await query('UPDATE creative_projects SET ai_credits_used = $1 WHERE id = $2', [creditsUsed, projectId]);

      // STEP 9-10: Quality check & ready
      await this.updateProjectStatus(projectId, 'ready', 100, 'Your advertisement is ready!');
      logger.info(`[${projectId}] Full production complete. Credits used: ${creditsUsed}`);

      return { success: true, creditsUsed };
    } catch (err) {
      logger.error(`[${projectId}] Production failed:`, err);
      await query(
        `UPDATE creative_projects SET status = 'failed', error_message = $1 WHERE id = $2`,
        [err.message, projectId]
      );
      throw err;
    }
  },

  async updateProjectStatus(projectId, step, progress, message) {
    await query(
      `UPDATE creative_projects SET status = $1, current_step = $2, progress = $3, updated_at = NOW() WHERE id = $4`,
      [progress >= 100 ? 'ready' : 'generating', `${message} (${step})`, progress, projectId]
    );
    logger.info(`[${projectId}] ${progress}% - ${message}`);
  },

  async saveAsset(projectId, assetType, assetSubtype, contentText, fileUrl, provider, metadata = {}) {
    const status = fileUrl ? 'ready' : (contentText ? 'ready' : 'pending');
    await query(
      `INSERT INTO project_assets (project_id, asset_type, asset_subtype, content_text, file_url, ai_provider, generation_params, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [projectId, assetType, assetSubtype, contentText, fileUrl, provider, JSON.stringify(metadata), metadata.status || status]
    );
  }
};

module.exports = { CreativeStudioService, ModelRouter };
