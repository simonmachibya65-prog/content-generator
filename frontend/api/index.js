// Minimal test first — confirm Vercel function works at all
module.exports = (req, res) => {
  res.json({ status: 'ok', message: 'Vercel function working', path: req.url });
};
