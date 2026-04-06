'use strict';
// server/computer/action.cjs — POST /computer/action
// Supports: click, type, key via AppleScript (no cliclick needed)
// Requires: COMPUTER_USE_TOKEN in env (Doppler)

const { exec } = require('child_process');

const TOKEN = process.env.COMPUTER_USE_TOKEN || '';

function authMiddleware(req, res, next) {
  if (!TOKEN) return next();
  const auth = req.headers.authorization || '';
  if (auth !== `Bearer ${TOKEN}`) { res.status(401).json({ error: 'unauthorized' }); return; }
  next();
}

function runAppleScript(script) {
  return new Promise((resolve, reject) => {
    exec(`osascript -e '${script.replace(/'/g, "'\\''")}'`, { timeout: 10000 }, (err, stdout) => {
      err ? reject(err) : resolve(stdout.trim());
    });
  });
}

/**
 * @param {import('express').Application} app
 */
function mount(app) {
  app.post('/computer/action', authMiddleware, async (req, res) => {
    const { type, x, y, text, key } = req.body || {};
    try {
      let result;
      if (type === 'click' && x !== undefined && y !== undefined) {
        result = await runAppleScript(`tell application "System Events" to click at {${x}, ${y}}`);
      } else if (type === 'type' && text) {
        result = await runAppleScript(`tell application "System Events" to keystroke "${text.replace(/"/g, '\\"')}"`);
      } else if (type === 'key' && key) {
        result = await runAppleScript(`tell application "System Events" to key code ${key}`);
      } else {
        return res.status(400).json({ error: 'invalid action. type: click|type|key' });
      }
      res.json({ ok: true, type, result });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });
}

module.exports = { mount };
