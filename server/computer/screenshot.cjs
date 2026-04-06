'use strict';
// server/computer/screenshot.cjs — GET /computer/screenshot
// Requires: COMPUTER_USE_TOKEN in env (Doppler)

const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.COMPUTER_USE_TOKEN || '';

function authMiddleware(req, res, next) {
  if (!TOKEN) return next(); // skip if not configured
  const auth = req.headers.authorization || '';
  if (auth !== `Bearer ${TOKEN}`) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  next();
}

/**
 * @param {import('express').Application} app
 */
function mount(app) {
  app.get('/computer/screenshot', authMiddleware, (req, res) => {
    const tmpFile = path.join('/tmp', `screenshot-${Date.now()}.png`);
    execFile('screencapture', ['-x', tmpFile], { timeout: 5000 }, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      const img = fs.readFileSync(tmpFile);
      fs.unlinkSync(tmpFile);
      res.setHeader('Content-Type', 'image/png');
      res.send(img);
    });
  });
}

module.exports = { mount };
