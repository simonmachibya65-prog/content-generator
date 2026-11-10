process.on('uncaughtException', function(err) {
  console.error('UNCAUGHT:', err.message, err.stack);
});

try {
  module.exports = function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, v: process.version }));
  };
} catch(e) {
  module.exports = function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: e.message }));
  };
}
