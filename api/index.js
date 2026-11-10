// ─── Vercel Serverless API Entry Point ─────────────────────────
// This file connects the Express backend to Vercel's serverless platform
// Routes: publift.vercel.app/api/* → handled by Express
//         publift.vercel.app/*     → served as React static files

// Set VERCEL env so server.js doesn't call app.listen()
process.env.VERCEL = '1';
process.env.NODE_ENV = 'production';

// Import the Express app from the backend
module.exports = require('../backend/src/server.js');
