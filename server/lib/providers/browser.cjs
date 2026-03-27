// server/lib/providers/browser.cjs — Browser Provider
// Uses Playwright to launch headless Chromium, navigate, extract content

const logger = require('../logger.cjs');

let playwright = null;

async function loadPlaywright() {
  if (!playwright) {
    try {
      playwright = require('playwright');
    } catch (e) {
      logger.error('Playwright not installed', { message: e.message });
      return null;
    }
  }
  return playwright;
}

async function query(url, options = {}) {
  const pw = await loadPlaywright();
  if (!pw) {
    return { text: '', model: 'chromium', tokens: 0, error: 'Playwright not installed' };
  }

  let browser = null;
  let page = null;
  const start = Date.now();

  try {
    browser = await pw.chromium.launch({ headless: true });
    const context = await browser.newContext();
    page = await context.newPage();

    await page.goto(url, {
      waitUntil: options.waitUntil || 'domcontentloaded',
      timeout: options.timeout || 30000,
    });

    // Extract content
    let content = '';
    if (options.selector) {
      try {
        content = await page.$eval(options.selector, el => el.textContent);
      } catch (e) {
        // Selector not found
        if (options.screenshotOnError) {
          const screenshotPath = `data/screenshots/error-${Date.now()}.png`;
          await page.screenshot({ path: screenshotPath, fullPage: false });
          logger.warn('Selector not found, screenshot saved', { selector: options.selector, screenshotPath });
        }
        throw new Error(`Selector "${options.selector}" not found`);
      }
    } else {
      content = await page.content();
    }

    const elapsed = Date.now() - start;
    return {
      text: content.slice(0, 50000),
      model: 'chromium',
      tokens: 0,
      elapsed_ms: elapsed,
    };
  } catch (e) {
    // Take error screenshot
    if (page && options.screenshotOnError !== false) {
      try {
        const screenshotPath = `data/screenshots/error-${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: false });
        logger.warn('Browser error screenshot saved', { screenshotPath });
      } catch (_) { /* ignore */ }
    }

    logger.error('Browser provider error', { url, message: e.message });
    return { text: '', model: 'chromium', tokens: 0, error: e.message };
  } finally {
    // Always close page first, then browser
    if (page) {
      try { await page.close(); } catch (_) {}
    }
    if (browser) {
      try { await browser.close(); } catch (_) {}
    }
  }
}

async function healthCheck() {
  const pw = await loadPlaywright();
  if (!pw) return { online: false, latency: -1 };

  try {
    const start = Date.now();
    const browser = await pw.chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('about:blank');
    await page.close();
    await browser.close();
    return { online: true, latency: Date.now() - start };
  } catch (e) {
    return { online: false, latency: -1 };
  }
}

module.exports = { name: 'browser', query, healthCheck };
