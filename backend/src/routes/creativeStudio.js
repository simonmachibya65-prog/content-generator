const express = require('express');
const { authenticate, requireAICredits } = require('../middleware/auth');
const { query } = require('../database');
const { CreativeStudioService, ModelRouter } = require('../services/creativeStudioService');
const logger = require('../utils/logger');

const router = express.Router();

// ─── GET /api/creative/projects ──────────────────────────────
router.get('/projects', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT cp.*, 
                 (SELECT file_url FROM project_assets WHERE project_id = cp.id AND asset_type = 'image' LIMIT 1) AS thumbnail_url
               FROM creative_projects cp WHERE cp.user_id = $1`;
    const params = [req.user.id];

    if (status) { params.push(status); sql += ` AND cp.status = $${params.length}`; }
    sql += ` ORDER BY cp.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await query(sql, params);
    res.json({ projects: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// ─── POST /api/creative/projects ─────────────────────────────
router.post('/projects', authenticate, async (req, res) => {
  try {
    const {
      name, category, business_name, product_service, description,
      objective, target_audience, country, language, platforms,
      special_instructions, brand_colors, brand_logo_url, ad_duration
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'Project name and category required' });
    }

    // Try to auto-fill from business profile
    let bizName = business_name;
    if (!bizName) {
      const { rows: bpRows } = await query(
        'SELECT business_name FROM business_profiles WHERE user_id = $1',
        [req.user.id]
      );
      bizName = bpRows[0]?.business_name;
    }

    const { rows } = await query(
      `INSERT INTO creative_projects (
        user_id, name, category, business_name, product_service, description,
        objective, target_audience, country, language, platforms,
        special_instructions, brand_colors, brand_logo_url, ad_duration, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'draft')
      RETURNING *`,
      [
        req.user.id, name, category, bizName || business_name, product_service, description,
        objective, target_audience, country || 'Tanzania', language || 'en',
        platforms || ['instagram', 'tiktok'], special_instructions,
        JSON.stringify(brand_colors || {}), brand_logo_url, ad_duration || 30
      ]
    );

    res.status(201).json({ project: rows[0] });
  } catch (err) {
    logger.error('Create creative project error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// ─── GET /api/creative/projects/:id ──────────────────────────
router.get('/projects/:id', authenticate, async (req, res) => {
  try {
    const { rows: projectRows } = await query(
      'SELECT * FROM creative_projects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!projectRows[0]) return res.status(404).json({ error: 'Project not found' });

    const { rows: briefRows } = await query(
      'SELECT * FROM creative_briefs WHERE project_id = $1',
      [req.params.id]
    );

    const { rows: assetRows } = await query(
      'SELECT * FROM project_assets WHERE project_id = $1 ORDER BY asset_type, sort_order',
      [req.params.id]
    );

    const { rows: versionRows } = await query(
      'SELECT * FROM platform_versions WHERE project_id = $1',
      [req.params.id]
    );

    res.json({
      project: projectRows[0],
      brief: briefRows[0] || null,
      assets: assetRows,
      versions: versionRows
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// ─── POST /api/creative/projects/:id/generate-brief ──────────
// Step 3: AI generates creative brief
router.post('/projects/:id/generate-brief', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM creative_projects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Project not found' });

    const brief = await CreativeStudioService.generateCreativeBrief(rows[0]);

    const { rows: savedRows } = await query(
      `INSERT INTO creative_briefs (project_id, objective, target_audience, key_message,
        creative_concept, headline, tagline, cta, image_prompt, image_style,
        video_script, video_scenes, voiceover_script, platform_notes, hashtags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT (project_id) DO UPDATE SET
         objective=$2, target_audience=$3, key_message=$4, creative_concept=$5,
         headline=$6, tagline=$7, cta=$8, image_prompt=$9, image_style=$10,
         video_script=$11, video_scenes=$12, voiceover_script=$13,
         platform_notes=$14, hashtags=$15, approved=FALSE
       RETURNING *`,
      [
        req.params.id, brief.objective, brief.target_audience, brief.key_message,
        brief.creative_concept, brief.headline, brief.tagline, brief.cta,
        brief.image_prompt, brief.image_style,
        brief.video_script, JSON.stringify(brief.video_scenes || []),
        brief.voiceover_script, JSON.stringify(brief.platform_notes || {}),
        brief.hashtags || []
      ]
    );

    await query(
      'UPDATE users SET ai_credits_used = ai_credits_used + 5 WHERE id = $1',
      [req.user.id]
    );

    await query(
      `UPDATE creative_projects SET status = 'planning', progress = 15 WHERE id = $1`,
      [req.params.id]
    );

    res.json({ brief: savedRows[0] });
  } catch (err) {
    logger.error('Generate brief error:', err);
    res.status(500).json({ error: 'Failed to generate creative brief' });
  }
});

// ─── POST /api/creative/projects/:id/approve-brief ───────────
router.post('/projects/:id/approve-brief', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE creative_briefs SET approved = TRUE, approved_at = NOW()
       WHERE project_id = $1
       RETURNING *`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Brief not found' });

    await query(
      `UPDATE creative_projects SET status = 'generating', progress = 20 WHERE id = $1`,
      [req.params.id]
    );

    res.json({ brief: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve brief' });
  }
});

// ─── POST /api/creative/projects/:id/generate-text ───────────
router.post('/projects/:id/generate-text', authenticate, async (req, res) => {
  try {
    const [{ rows: projectRows }, { rows: briefRows }] = await Promise.all([
      query('SELECT * FROM creative_projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]),
      query('SELECT * FROM creative_briefs WHERE project_id = $1', [req.params.id])
    ]);

    if (!projectRows[0]) return res.status(404).json({ error: 'Project not found' });

    const textAssets = await CreativeStudioService.generateTextAssets(projectRows[0], briefRows[0] || {});

    // Save each text asset
    for (const [subtype, content] of Object.entries({
      captions: JSON.stringify(textAssets.captions),
      headlines: JSON.stringify(textAssets.headlines),
      body_copy: textAssets.body_copy,
      hashtags: (textAssets.hashtags || []).join(' '),
      voiceover_script: textAssets.voiceover_script,
      cta_variations: JSON.stringify(textAssets.cta_variations)
    })) {
      if (content) {
        await query(
          `INSERT INTO project_assets (project_id, asset_type, asset_subtype, content_text, ai_provider, status)
           VALUES ($1,'text',$2,$3,'openai','ready')
           ON CONFLICT DO NOTHING`,
          [req.params.id, subtype, content]
        );
      }
    }

    await query('UPDATE users SET ai_credits_used = ai_credits_used + 2 WHERE id = $1', [req.user.id]);

    res.json({ textAssets, credits_used: 2 });
  } catch (err) {
    logger.error('Generate text error:', err);
    res.status(500).json({ error: 'Failed to generate text content' });
  }
});

// ─── POST /api/creative/projects/:id/generate-images ─────────
router.post('/projects/:id/generate-images', authenticate, async (req, res) => {
  try {
    const [{ rows: projectRows }, { rows: briefRows }] = await Promise.all([
      query('SELECT * FROM creative_projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]),
      query('SELECT * FROM creative_briefs WHERE project_id = $1', [req.params.id])
    ]);
    if (!projectRows[0]) return res.status(404).json({ error: 'Project not found' });

    const brief = briefRows[0] || {};
    const imageAssets = await CreativeStudioService.generateImageAssets(projectRows[0], brief);
    let creditsUsed = 0;

    for (const img of imageAssets) {
      await query(
        `INSERT INTO project_assets (project_id, asset_type, asset_subtype, file_url, ai_provider, generation_prompt, status)
         VALUES ($1,'image',$2,$3,$4,$5,$6)`,
        [req.params.id, img.subtype, img.url, img.provider || 'openai', img.prompt, img.status]
      );
      if (img.status === 'ready') creditsUsed += 3;
    }

    await query('UPDATE users SET ai_credits_used = ai_credits_used + $1 WHERE id = $2', [creditsUsed, req.user.id]);

    res.json({ images: imageAssets, credits_used: creditsUsed });
  } catch (err) {
    logger.error('Generate images error:', err);
    res.status(500).json({ error: 'Failed to generate images' });
  }
});

// ─── POST /api/creative/projects/:id/generate-voiceover ──────
router.post('/projects/:id/generate-voiceover', authenticate, async (req, res) => {
  try {
    const { voice = 'female_professional', speed = 1.0, custom_script } = req.body;

    const [{ rows: projectRows }, { rows: briefRows }] = await Promise.all([
      query('SELECT * FROM creative_projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]),
      query('SELECT * FROM creative_briefs WHERE project_id = $1', [req.params.id])
    ]);
    if (!projectRows[0]) return res.status(404).json({ error: 'Project not found' });

    const script = custom_script || briefRows[0]?.voiceover_script;
    if (!script) return res.status(400).json({ error: 'No voiceover script found. Generate a brief first.' });

    const result = await CreativeStudioService.generateVoiceover(
      projectRows[0], briefRows[0] || {}, { voice, speed }
    );

    // In production: upload buffer to S3, save URL
    // For now save script
    await query(
      `INSERT INTO project_assets (project_id, asset_type, asset_subtype, content_text, ai_provider, status)
       VALUES ($1,'voiceover','narration',$2,$3,$4)`,
      [req.params.id, script, result?.provider || 'openai', result?.status || 'ready']
    );

    await query('UPDATE users SET ai_credits_used = ai_credits_used + 2 WHERE id = $1', [req.user.id]);

    res.json({
      script,
      provider: result?.provider,
      status: result?.status,
      credits_used: 2,
      message: result?.status === 'ready' ? 'Voiceover generated' : result?.error || 'Failed'
    });
  } catch (err) {
    logger.error('Voiceover error:', err);
    res.status(500).json({ error: 'Failed to generate voiceover' });
  }
});

// ─── POST /api/creative/projects/:id/produce ─────────────────
// ONE-CLICK: Full production — runs all steps asynchronously
router.post('/projects/:id/produce', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM creative_projects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Project not found' });

    // Check credits
    const { rows: userRows } = await query(
      'SELECT ai_credits, ai_credits_used FROM users WHERE id = $1',
      [req.user.id]
    );
    const remaining = (userRows[0]?.ai_credits || 0) - (userRows[0]?.ai_credits_used || 0);
    if (remaining < 20) {
      return res.status(400).json({ error: 'Insufficient AI credits. Need at least 20 credits for full production.' });
    }

    // Log production job
    const { rows: jobRows } = await query(
      `INSERT INTO production_jobs (project_id, user_id, job_type, status)
       VALUES ($1,$2,'full_production','running') RETURNING id`,
      [req.params.id, req.user.id]
    );

    // Start production asynchronously (don't await)
    CreativeStudioService.runFullProduction(req.params.id, req.user.id)
      .then(result => {
        query(
          `UPDATE production_jobs SET status = 'completed', completed_at = NOW(), result = $1 WHERE id = $2`,
          [JSON.stringify(result), jobRows[0].id]
        );
      })
      .catch(err => {
        query(
          `UPDATE production_jobs SET status = 'failed', error = $1 WHERE id = $2`,
          [err.message, jobRows[0].id]
        );
        logger.error(`Production job ${jobRows[0].id} failed:`, err);
      });

    res.json({
      message: 'Production started! Your advertisement is being created.',
      jobId: jobRows[0].id,
      projectId: req.params.id,
      estimatedTime: '2-5 minutes'
    });
  } catch (err) {
    logger.error('Produce error:', err);
    res.status(500).json({ error: 'Failed to start production' });
  }
});

// ─── GET /api/creative/projects/:id/progress ─────────────────
router.get('/projects/:id/progress', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT status, progress, current_step, error_message FROM creative_projects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Project not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

// ─── PUT /api/creative/assets/:assetId ────────────────────────
// Edit/replace an individual asset
router.put('/assets/:assetId', authenticate, async (req, res) => {
  try {
    const { content_text, file_url, is_edited } = req.body;
    const { rows } = await query(
      `UPDATE project_assets
       SET content_text = COALESCE($1, content_text),
           file_url = COALESCE($2, file_url),
           is_edited = $3,
           edited_url = COALESCE($2, edited_url),
           status = 'ready',
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [content_text, file_url, is_edited || true, req.params.assetId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Asset not found' });
    res.json({ asset: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

// ─── POST /api/creative/assets/:assetId/regenerate ────────────
router.post('/assets/:assetId/regenerate', authenticate, async (req, res) => {
  try {
    const { rows: assetRows } = await query(
      `SELECT pa.*, cp.* FROM project_assets pa
       JOIN creative_projects cp ON cp.id = pa.project_id
       WHERE pa.id = $1 AND cp.user_id = $2`,
      [req.params.assetId, req.user.id]
    );
    if (!assetRows[0]) return res.status(404).json({ error: 'Asset not found' });

    const asset = assetRows[0];

    // Mark as regenerating
    await query(`UPDATE project_assets SET status = 'generating' WHERE id = $1`, [req.params.assetId]);

    let newResult = null;
    if (asset.asset_type === 'image') {
      const { rows: briefRows } = await query('SELECT * FROM creative_briefs WHERE project_id = $1', [asset.project_id]);
      const result = await ModelRouter.image(req.body.prompt || asset.generation_prompt, { size: '1024x1024' });
      await query(
        `UPDATE project_assets SET file_url = $1, status = 'ready', is_edited = FALSE WHERE id = $2`,
        [result.url, req.params.assetId]
      );
      newResult = result;
      await query('UPDATE users SET ai_credits_used = ai_credits_used + 3 WHERE id = $1', [req.user.id]);
    } else if (asset.asset_type === 'text') {
      // Regenerate text with custom prompt
      const newText = await ModelRouter.text(req.body.prompt || `Regenerate: ${asset.content_text}`, 'You are a professional copywriter.');
      await query(
        `UPDATE project_assets SET content_text = $1, status = 'ready' WHERE id = $2`,
        [newText, req.params.assetId]
      );
      newResult = { text: newText };
      await query('UPDATE users SET ai_credits_used = ai_credits_used + 1 WHERE id = $1', [req.user.id]);
    }

    const { rows: updated } = await query('SELECT * FROM project_assets WHERE id = $1', [req.params.assetId]);
    res.json({ asset: updated[0], result: newResult });
  } catch (err) {
    logger.error('Regenerate asset error:', err);
    await query(`UPDATE project_assets SET status = 'failed' WHERE id = $1`, [req.params.assetId]);
    res.status(500).json({ error: 'Failed to regenerate asset' });
  }
});

// ─── GET /api/creative/projects/:id/export ───────────────────
router.get('/projects/:id/export', authenticate, async (req, res) => {
  try {
    const { platform } = req.query;

    const [{ rows: projectRows }, { rows: assetRows }, { rows: versionRows }] = await Promise.all([
      query('SELECT * FROM creative_projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]),
      query(`SELECT * FROM project_assets WHERE project_id = $1 AND status = 'ready' ORDER BY asset_type, sort_order`, [req.params.id]),
      query(`SELECT * FROM platform_versions WHERE project_id = $1 ${platform ? 'AND platform = $2' : ''}`,
        platform ? [req.params.id, platform] : [req.params.id])
    ]);

    if (!projectRows[0]) return res.status(404).json({ error: 'Project not found' });

    // Organize assets by type
    const organized = {
      images: assetRows.filter(a => a.asset_type === 'image'),
      text: assetRows.filter(a => a.asset_type === 'text'),
      video_scenes: assetRows.filter(a => a.asset_type === 'video_scene'),
      voiceover: assetRows.filter(a => a.asset_type === 'voiceover'),
      versions: versionRows
    };

    res.json({ project: projectRows[0], assets: organized });
  } catch (err) {
    res.status(500).json({ error: 'Failed to export project' });
  }
});

// ─── DELETE /api/creative/projects/:id ───────────────────────
router.delete('/projects/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'DELETE FROM creative_projects WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;
