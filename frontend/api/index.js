// Vercel Serverless Function — routes all /api/* requests through the Express app
const app = require('../api-src/server.js');
module.exports = app;
