// server/shadow-router.cjs — Shadow Router v2.0
// Routes prompts to LLM web UIs via Playwright CDP (Chrome DevTools Protocol)
// Port: 3002 | Requires: Chrome with --remote-debugging-port=9222

const express = require('express');
const { chromium } = require('playwright');
const os = require('os');
const app = express();
const PORT = process.env.SHADOW_ROUTER_PORT || 3002;

// ─── CDP CONFIG ─────────────────────────────────────────────────────────────

const CDP_ENDPOINT = process.env.CDP_ENDPOINT || 'http://127.0.0.1:9222';
const RAM_THRESHOLD_MB = 400;
const PAGE_TIMEOUT_MS = 60000;
const RESPONSE_POLL_MS = 500;
const RESPONSE_MAX_WAIT_MS = 45000;

let browser = null;

// ─── TARGET DEFINITIONS ─────────────────────────────────────────────────────

const TARGETS = {
  gemini: {
    url: 'https://gemini.google.com/app',
    inputSelector: 'div.ql-editor[contenteditable="true"], textarea[aria-label], .input-area textarea, rich-textarea .ql-editor',
    submitSelector: 'button[aria-label="Send message"], button.send-button, .send-button-container button',
    responseSelector: '.model-response-text, .response-container, message-content .markdown',
    name: 'Gemini Browser',
  },
  groq: {
    url: 'https://groq.com/',
    inputSelector: 'textarea[placeholder], textarea.chat-input, #chat-input',
    submitSelector: 'button[type="submit"], button[aria-label="Send"], button.send-btn',
    responseSelector: '.prose, .message-content, .assistant-message, [data-role="assistant"]',
    name: 'Groq Browser',
  },
  manus: {
    url: 'https://manus.im/chat',
    inputSelector: 'textarea, input[type="text"].chat-input',
    submitSelector: 'button[type="submit"], button.send-button',
    responseSelector: '.message-content, .assistant-response, .chat-message.assistant',
    name: 'Manus Browser',
  },
  perplexity: {
    url: 'https://www.perplexity.ai/',
    inputSelector: 'textarea[placeholder], textarea.search-input, #search-input',
    submitSelector: 'button[aria-label="Submit"], button.submit-btn, button[type="submit"]',
    responseSelector: '.prose, .answer-text, .markdown-content, [data-testid="answer"]',
    name: 'Perplexity Browser',
  },
  perplexity2: {
    url: 'https://www.perplexity.ai/',
    inputSelector: 'textarea[placeholder], textarea.search-input',
    submitSelector: 'button[aria-label="Submit"], button[type="submit"]',
    responseSelector: '.prose, .answer-text, .markdown-content',
    name: 'Perplexity Chat (Comet)',
  },
  antigravity: {
    url: 'https://antigravity.ai/chat',
    inputSelector: 'textarea, input[type="text"]',
    submitSelector: 'button[type="submit"], button.send-button',
    responseSelector: '.message-content, .response, .assistant-message',
    name: 'Antigravity Copilot',
  },
  copilot: {
    url: 'https://copilot.microsoft.com/',
    inputSelector: '#searchbox, textarea[placeholder], #userInput',
    submitSelector: 'button[aria-label="Submit"], button.submit-btn, #submit-button',
    responseSelector: '.response-message, .ac-textBlock, [data-content="ai-message"]',
    name: 'Microsoft Copilot',
  },
  chatgpt: {
    url: 'https://chatgpt.com/',
    inputSelector: '#prompt-textarea, textarea[data-id]',
    submitSelector: 'button[data-testid="send-button"], button[aria-label="Send prompt"]',
    responseSelector: '.markdown, .result-streaming, [data-message-author-role="assistant"]',
    name: 'ChatGPT Browser',
  },
  grok: {
    url: 'https://grok.com/',
    inputSelector: 'textarea, .chat-input',
    submitSelector: 'button[type="submit"], button.send-btn',
    responseSelector: '.prose, .message-content, .assistant-message',
    name: 'Grok Browser',
  },
};

// ─── HELPERS ────────────────────────────────────────────────────────────────

function getFreeRAM() {
  return Math.round(os.freemem() / (1024 * 1024));
}

async function ensureBrowser() {
  if (browser && browser.isConnected()) return browser;
  try {
    browser = await chromium.connectOverCDP(CDP_ENDPOINT);
    console.log('[shadow-router] Connected to Chrome via CDP');
    return browser;
  } catch (err) {
    throw new Error('CDP connect failed: ' + err.message + '. Is Chrome running with --remote-debugging-port=9222?');
  }
}

async function routeViaPage(target, prompt) {
  const config = TARGETS[target];
  if (!config) throw new Error('Unknown target: ' + target + '. Available: ' + Object.keys(TARGETS).join(', '));

  const freeRAM = getFreeRAM();
  if (freeRAM < RAM_THRESHOLD_MB) {
    throw new Error('LOW_RAM: ' + freeRAM + 'MB free (threshold: ' + RAM_THRESHOLD_MB + 'MB)');
  }

  const bro = await ensureBrowser();
  const context = bro.contexts()[0] || await bro.newContext();
  const page = await context.newPage();

  try {
    await page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT_MS });
    await page.waitForTimeout(2000);

    const input = await page.waitForSelector(config.inputSelector, { timeout: 15000 });
    await input.click();
    await input.fill('');
    await page.keyboard.type(prompt, { delay: 10 });
    await page.waitForTimeout(500);

    // Count existing responses before submitting
    const beforeCount = await page.locator(config.responseSelector).count().catch(() => 0);

    // Submit
    const submitBtn = await page.$(config.submitSelector);
    if (submitBtn) {
      await submitBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }

    // Wait for new response
    const responseText = await pollForResponse(page, config.responseSelector, beforeCount);
    return responseText;
  } finally {
    await page.close().catch(() => {});
  }
}

async function pollForResponse(page, selector, beforeCount) {
  const start = Date.now();
  let lastText = '';

  while (Date.now() - start < RESPONSE_MAX_WAIT_MS) {
    await page.waitForTimeout(RESPONSE_POLL_MS);

    const texts = await page.locator(selector).allTextContents().catch(() => []);
    const filtered = texts.map(t => t.trim()).filter(Boolean);

    if (filtered.length > beforeCount) {
      const newText = filtered[filtered.length - 1];
      if (newText === lastText && newText.length > 10) {
        return newText;
      }
      lastText = newText;
    }
  }

  if (lastText) return lastText;
  throw new Error('Response timeout: no new content detected');
}

// ─── ROUTES ─────────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'shadow-router',
    port: PORT,
    cdp: CDP_ENDPOINT,
    freeRAM: getFreeRAM(),
    ramThreshold: RAM_THRESHOLD_MB,
    browserConnected: !!(browser && browser.isConnected()),
    targets: Object.keys(TARGETS),
  });
});

app.get('/ram', (req, res) => {
  const free_mb = getFreeRAM();
  res.json({
    free_mb,
    safe: free_mb >= RAM_THRESHOLD_MB,
    critical: free_mb < 200,
    threshold: RAM_THRESHOLD_MB,
  });
});

app.get('/targets', (req, res) => {
  const list = Object.entries(TARGETS).map(function([id, cfg]) {
    return { id: id, name: cfg.name, url: cfg.url };
  });
  res.json({ targets: list, count: list.length });
});

// Main routing endpoint: GET /route/:target/:prompt
app.get('/route/:target/:prompt', async (req, res) => {
  const target = req.params.target;
  const prompt = decodeURIComponent(req.params.prompt);
  const t0 = Date.now();

  try {
    const response = await routeViaPage(target, prompt);
    res.json({
      target: target,
      prompt: prompt.slice(0, 100),
      response: response,
      latency: Date.now() - t0,
      freeRAM: getFreeRAM(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const status = err.message.indexOf('LOW_RAM') !== -1 ? 503 : 500;
    res.status(status).json({
      error: err.message,
      target: target,
      freeRAM: getFreeRAM(),
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /route/:target — accepts JSON body { prompt }
app.use(express.json());
app.post('/route/:target', async (req, res) => {
  const target = req.params.target;
  const prompt = (req.body && req.body.prompt) || '';
  const t0 = Date.now();

  if (!prompt) return res.status(400).json({ error: 'prompt required in body' });

  try {
    const response = await routeViaPage(target, prompt);
    res.json({
      target: target,
      prompt: prompt.slice(0, 100),
      response: response,
      latency: Date.now() - t0,
      freeRAM: getFreeRAM(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const status = err.message.indexOf('LOW_RAM') !== -1 ? 503 : 500;
    res.status(status).json({ error: err.message, target: target });
  }
});

// ─── START ──────────────────────────────────────────────────────────────────

app.listen(PORT, function() {
  console.log('[shadow-router] v2.0 listening on :' + PORT);
  console.log('[shadow-router] CDP endpoint: ' + CDP_ENDPOINT);
  console.log('[shadow-router] Targets: ' + Object.keys(TARGETS).join(', '));
  console.log('[shadow-router] Free RAM: ' + getFreeRAM() + 'MB (threshold: ' + RAM_THRESHOLD_MB + 'MB)');

  ensureBrowser().catch(function(err) {
    console.warn('[shadow-router] Chrome not available yet: ' + err.message);
    console.warn('[shadow-router] Start Chrome: open -a "Google Chrome" --args --remote-debugging-port=9222');
  });
});

module.exports = app;
