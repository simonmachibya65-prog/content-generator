const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

// Use dynamic database based on environment
const useMockDb = !process.env.DATABASE_URL || 
                  process.env.DATABASE_URL.includes('your_') ||
                  process.env.DATABASE_URL.startsWith('#');

const { query } = useMockDb 
  ? require('../database/mockDb')
  : require('../database');

const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Google OAuth config
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_AUTH_REDIRECT_URI = process.env.GOOGLE_AUTH_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';

// Validation schemas
const registerSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  timezone: Joi.string().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

function generateTokens(userId) {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
  return { accessToken, refreshToken };
}

// ─── POST /api/auth/register ──────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { full_name, email, password, timezone } = value;

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows[0]) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { rows } = await query(
      `INSERT INTO users (full_name, email, password_hash, timezone)
       VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, plan, ai_credits`,
      [full_name, email, password_hash, timezone || 'Africa/Dar_es_Salaam']
    );

    const user = rows[0];
    const { accessToken, refreshToken } = generateTokens(user.id);

    logger.info('New user registered', { userId: user.id, email: user.email });

    res.status(201).json({
      message: 'Account created successfully',
      user: { id: user.id, email: user.email, full_name: user.full_name, plan: user.plan },
      accessToken,
      refreshToken
    });
  } catch (err) {
    logger.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password } = value;

    const { rows } = await query(
      `SELECT id, email, full_name, password_hash, plan, ai_credits, ai_credits_used, is_active
       FROM users WHERE email = $1`,
      [email]
    );

    const user = rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    const { accessToken, refreshToken } = generateTokens(user.id);

    logger.info('User logged in', { userId: user.id });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        plan: user.plan,
        ai_credits: user.ai_credits,
        ai_credits_used: user.ai_credits_used
      },
      accessToken,
      refreshToken
    });
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── POST /api/auth/refresh ───────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    const { rows } = await query(
      'SELECT id FROM users WHERE id = $1 AND is_active = TRUE',
      [decoded.userId]
    );

    if (!rows[0]) return res.status(401).json({ error: 'User not found' });

    const tokens = generateTokens(decoded.userId);
    res.json(tokens);
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, email, full_name, avatar_url, timezone, language, plan,
              ai_credits, ai_credits_used, email_verified, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────
router.post('/logout', authenticate, (req, res) => {
  res.clearCookie('access_token');
  res.json({ message: 'Logged out successfully' });
});

// ─── GET /api/auth/google ─────────────────────────────────
// Initiate Google OAuth for user authentication
router.get('/google', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_AUTH_REDIRECT_URI,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    prompt: 'select_account'
  })}`;

  res.redirect(authUrl);
});

// ─── GET /api/auth/google/callback ────────────────────────
// Handle Google OAuth callback for user authentication
router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query;
  const frontendUrl = process.env.APP_URL || 'http://localhost:3000';

  try {
    if (error) {
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }

    if (!code) {
      return res.redirect(`${frontendUrl}/login?error=missing_code`);
    }

    // Exchange code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_AUTH_REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    const { access_token } = tokenResponse.data;

    // Get user info from Google
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const googleUser = userInfoResponse.data;

    // Check if user exists
    let { rows } = await query('SELECT * FROM users WHERE email = $1', [googleUser.email]);
    let user = rows[0];

    if (!user) {
      // Create new user
      const { rows: newUserRows } = await query(
        `INSERT INTO users (full_name, email, password_hash, avatar_url, email_verified)
         VALUES ($1, $2, $3, $4, TRUE)
         RETURNING id, email, full_name, plan, ai_credits, ai_credits_used`,
        [
          googleUser.name,
          googleUser.email,
          await bcrypt.hash(uuidv4(), 12), // Random password (won't be used)
          googleUser.picture
        ]
      );
      user = newUserRows[0];
      logger.info('New user registered via Google:', { userId: user.id, email: user.email });
    } else {
      // Update last login
      await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
      logger.info('User logged in via Google:', { userId: user.id });
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Redirect to frontend with token
    res.redirect(`${frontendUrl}/auth/google/success?token=${accessToken}&refresh=${refreshToken}`);
  } catch (err) {
    logger.error('Google auth callback error:', err);
    res.redirect(`${frontendUrl}/login?error=authentication_failed`);
  }
});

module.exports = router;
