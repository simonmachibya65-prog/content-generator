// Absolute minimal — no dependencies at all
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ 
    ok: true, 
    url: req.url,
    node: process.version,
    cwd: process.cwd(),
    env: process.env.NODE_ENV
  }));
};
