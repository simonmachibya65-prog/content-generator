// Vercel Serverless Function — exposes the Express backend under /api/*
const app = require('../backend/src/server.js');
module.exports = app;
