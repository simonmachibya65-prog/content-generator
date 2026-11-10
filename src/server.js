require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const logger = require('./utils/logger');
const { connectDatabase } = require('./database');
const scheduler = require('./services/scheduler');

// ─── Route Imports ────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const oauthRoutes = require('./routes/oauth');
const socialAccountRoutes = require('./routes/socialAccounts');
const contentRoutes = require('./routes/content');
const publishingRoutes = require('./routes/publishing');
const analyticsRoutes = require('./routes/analytics');
const campaignRoutes = require('./routes/campaigns');
const mediaRoutes = require('./routes/media');
const billingRoutes = require('./routes/billing');
const teamRoutes = require('./routes/team');
const notificationRoutes = require('./routes/notifications');
const businessRoutes = require('./routes/business');
const automationRoutes = require('./routes/automation');
const adminRoutes = require('./routes/admin');
const creativeStudioRoutes = require('./routes/creativeStudio');
const advertisingRoutes = require('./routes/advertising');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());

app.use(cors({
  origin: [
    process.env.APP_URL || 'http://localhost:3000',
    /\.vercel\.app$/,  // Allow all Vercel preview/production domains
    'https://publift-frontend.vercel.app'
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests. Please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Increased from 10 to 100 for development
  message: { error: 'Too many auth attempts. Please try again later.' }
});

app.use('/api/', globalLimiter);
app.use('/api/auth/', authLimiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Static Files ─────────────────────────────────────────────────────────────
// Note: On Vercel serverless, file uploads should use external storage (S3, etc.)
// Static file serving is disabled in serverless environments
if (!process.env.VERCEL) {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/social-accounts', socialAccountRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/publishing', publishingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/creative', creativeStudioRoutes);
app.use('/api/advertising', advertisingRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Publift API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Also serve health under /api for Vercel serverless deployment
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Publift API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', { message: err.message, stack: err.stack });
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
// Only start the server when NOT running on Vercel (serverless)
// Vercel's @vercel/node uses the exported app directly
if (!process.env.VERCEL) {
  async function start() {
    try {
      await connectDatabase();
      logger.info('Database connected');

      scheduler.init();
      logger.info('Scheduler initialized');

      app.listen(PORT, () => {
        logger.info(`Publift API running on port ${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV}`);
      });
    } catch (err) {
      logger.error('Failed to start server:', err);
      process.exit(1);
    }
  }

  start();
} else {
  // On Vercel: connect database on cold start (no scheduler in serverless)
  connectDatabase().then(() => {
    logger.info('Database connected (Vercel serverless)');
  }).catch(err => {
    logger.error('Database connection failed:', err);
  });
}

module.exports = app;
