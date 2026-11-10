const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');
const { query } = require('../database');
const logger = require('../utils/logger');

const router = express.Router();

// Use memory storage on Vercel (no persistent disk), disk storage locally
const storage = process.env.VERCEL
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB on serverless (Vercel limit)
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|mp4|mov|avi|pdf|docx/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext.slice(1))) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// ─── POST /api/media/upload ───────────────────────────────────
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    let fileUrl;
    const uniqueName = `${uuidv4()}${path.extname(req.file.originalname)}`;

    if (process.env.VERCEL) {
      // On Vercel: write to /tmp (ephemeral) and serve via data URL for small files,
      // or store base64 in DB. For now we write to /tmp and return a placeholder URL.
      // In production you'd upload req.file.buffer to S3/Cloudflare R2/Vercel Blob.
      const tmpPath = `/tmp/${uniqueName}`;
      fs.writeFileSync(tmpPath, req.file.buffer);
      fileUrl = `${process.env.APP_URL || ''}/api/media/serve/${uniqueName}`;
    } else {
      fileUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${uniqueName}`;
      const uploadDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(path.join(uploadDir, uniqueName), req.file.buffer || fs.readFileSync(req.file.path));
    }

    const fileType = req.file.mimetype.startsWith('image') ? 'image' :
                     req.file.mimetype.startsWith('video') ? 'video' : 'document';

    const { rows } = await query(
      `INSERT INTO media_files
         (user_id, filename, original_name, file_type, mime_type, file_size, file_url, folder, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        req.user.id, uniqueName, req.file.originalname,
        fileType, req.file.mimetype, req.file.size, fileUrl,
        req.body.folder || 'root', req.body.tags ? req.body.tags.split(',') : []
      ]
    );

    logger.info(`Media uploaded: ${uniqueName} by user ${req.user.id}`);
    res.status(201).json({ media: rows[0] });
  } catch (err) {
    logger.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ─── GET /api/media ───────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, folder, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let sql = 'SELECT *, COUNT(*) OVER() AS total_count FROM media_files WHERE user_id = $1';
    const params = [req.user.id];

    if (type) { params.push(type); sql += ` AND file_type = $${params.length}`; }
    if (folder) { params.push(folder); sql += ` AND folder = $${params.length}`; }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await query(sql, params);
    res.json({
      media: rows,
      pagination: { page: +page, limit: +limit, total: +(rows[0]?.total_count || 0) }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

// ─── DELETE /api/media/:id ────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'DELETE FROM media_files WHERE id = $1 AND user_id = $2 RETURNING filename',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Media not found' });

    const filePath = path.join(__dirname, '../../uploads', rows[0].filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ message: 'Media deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

// ─── POST /api/media/bulk-delete ─────────────────────────────
router.post('/bulk-delete', authenticate, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids?.length) return res.status(400).json({ error: 'No IDs provided' });

    const placeholders = ids.map((_, i) => `$${i + 2}`).join(',');
    const { rows } = await query(
      `DELETE FROM media_files WHERE user_id = $1 AND id IN (${placeholders}) RETURNING filename`,
      [req.user.id, ...ids]
    );

    rows.forEach(r => {
      const filePath = path.join(__dirname, '../../uploads', r.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    res.json({ deleted: rows.length });
  } catch (err) {
    res.status(500).json({ error: 'Bulk delete failed' });
  }
});

// ─── POST /api/media/bulk-move ────────────────────────────────
router.post('/bulk-move', authenticate, async (req, res) => {
  try {
    const { ids, folder_id } = req.body;
    if (!ids?.length) return res.status(400).json({ error: 'No IDs provided' });

    const placeholders = ids.map((_, i) => `$${i + 3}`).join(',');
    await query(
      `UPDATE media_files SET folder_id = $1 WHERE user_id = $2 AND id IN (${placeholders})`,
      [folder_id || null, req.user.id, ...ids]
    );

    res.json({ moved: ids.length });
  } catch (err) {
    res.status(500).json({ error: 'Bulk move failed' });
  }
});

// ─── PUT /api/media/:id/tags ──────────────────────────────────
router.put('/:id/tags', authenticate, async (req, res) => {
  try {
    const { tags } = req.body;
    const { rows } = await query(
      `UPDATE media_files SET tags = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
      [tags || [], req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Media not found' });
    res.json({ media: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update tags' });
  }
});

// ─── GET /api/media/tags ──────────────────────────────────────
router.get('/tags', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT DISTINCT unnest(tags) AS tag FROM media_files WHERE user_id = $1 ORDER BY tag`,
      [req.user.id]
    );
    res.json({ tags: rows.map(r => r.tag).filter(Boolean) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// ─── GET /api/media/folders ───────────────────────────────────
router.get('/folders', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT f.*, COUNT(mf.id) AS file_count
       FROM media_folders f
       LEFT JOIN media_files mf ON mf.folder_id = f.id
       WHERE f.user_id = $1
       GROUP BY f.id
       ORDER BY f.name ASC`,
      [req.user.id]
    );
    res.json({ folders: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// ─── POST /api/media/folders ──────────────────────────────────
router.post('/folders', authenticate, async (req, res) => {
  try {
    const { name, parent_id } = req.body;
    if (!name) return res.status(400).json({ error: 'Folder name required' });

    const { rows } = await query(
      `INSERT INTO media_folders (user_id, name, parent_id) VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, name, parent_id || null]
    );
    res.status(201).json({ folder: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// ─── DELETE /api/media/folders/:id ───────────────────────────
router.delete('/folders/:id', authenticate, async (req, res) => {
  try {
    // Move files to root before deleting
    await query(
      `UPDATE media_files SET folder_id = NULL WHERE folder_id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    const { rows } = await query(
      `DELETE FROM media_folders WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Folder not found' });
    res.json({ message: 'Folder deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

module.exports = router;
