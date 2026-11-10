// Debug: catch and return any startup error
let app;
let startupError;

try {
  app = require('./server.js');
} catch (e) {
  startupError = e.message + '\n' + e.stack;
}

module.exports = (req, res) => {
  if (startupError) {
    res.status(200).json({ startup_error: startupError });
    return;
  }
  app(req, res);
};
