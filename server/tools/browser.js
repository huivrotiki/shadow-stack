/**
 * Browser Tool — Playwright automation for Orchestrator
 * Provides headless Chromium actions: navigate, click, type, screenshot, evaluate
 */

import logger from '../lib/logger.cjs';

let playwright = null;

async function getPlaywright() {
  if (!playwright) {
    try {
      const pw = await import('playwright');
      playwright = pw.default || pw;
    } catch (e) {
      logger.error('Playwright not installed', { message: e.message });
      throw new Error('Playwright not installed. Run: npx playwright install chromium');
    }
  }
  return playwright;
}

/**
 * Execute browser action
 * @param {object} input - { action, url?, selector?, text?, script?, waitUntil?, timeout? }
 * @returns {object} - { text, model, tokens, screenshots?, latency_ms }
 */
export async function execute(input) {
  const { action, url, selector, text: inputText, script, waitUntil, timeout } = input;

  const pw = await getPlaywright();
  const start = Date.now();
  let browser = null;
  let page = null;

  try {
    browser = await pw.chromium.launch({ headless: true });
    const context = await browser.newContext();
    page = await context.newPage();

    let result = '';

    switch (action) {
      case 'navigate': {
        if (!url) throw new Error('navigate requires url');
        await page.goto(url, {
          waitUntil: waitUntil || 'domcontentloaded',
          timeout: timeout || 30000,
        });
        result = `Navigated to ${url}`;
        break;
      }

      case 'click': {
        if (!selector) throw new Error('click requires selector');
        await page.click(selector, { timeout: timeout || 5000 });
        result = `Clicked ${selector}`;
        break;
      }

      case 'type': {
        if (!selector || !inputText) throw new Error('type requires selector and text');
        await page.fill(selector, inputText, { timeout: timeout || 5000 });
        result = `Typed into ${selector}`;
        break;
      }

      case 'screenshot': {
        if (url) {
          await page.goto(url, {
            waitUntil: waitUntil || 'domcontentloaded',
            timeout: timeout || 30000,
          });
        }
        const screenshotPath = `data/screenshots/${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: false });
        result = `Screenshot saved to ${screenshotPath}`;
        break;
      }

      case 'evaluate': {
        if (!script) throw new Error('evaluate requires script');
        if (url) {
          await page.goto(url, {
            waitUntil: waitUntil || 'domcontentloaded',
            timeout: timeout || 30000,
          });
        }
        const evalResult = await page.evaluate(script);
        result = typeof evalResult === 'string' ? evalResult : JSON.stringify(evalResult);
        break;
      }

      case 'scrape': {
        if (!url) throw new Error('scrape requires url');
        await page.goto(url, {
          waitUntil: waitUntil || 'domcontentloaded',
          timeout: timeout || 30000,
        });

        if (selector) {
          try {
            result = await page.$eval(selector, el => el.textContent);
          } catch (e) {
            throw new Error(`Selector "${selector}" not found on ${url}`);
          }
        } else {
          result = await page.content();
        }

        // Trim to reasonable size
        result = result.slice(0, 50000);
        break;
      }

      default:
        throw new Error(`Unknown browser action: ${action}`);
    }

    return {
      text: result,
      model: 'chromium',
      tokens: 0,
      latency_ms: Date.now() - start,
    };
  } catch (e) {
    logger.error('Browser tool error', { action, error: e.message });

    // Screenshot on error
    if (page) {
      try {
        const errorPath = `data/screenshots/error-${Date.now()}.png`;
        await page.screenshot({ path: errorPath, fullPage: false });
        logger.info('Error screenshot saved', { path: errorPath });
      } catch (_) {}
    }

    return {
      text: '',
      model: 'chromium',
      tokens: 0,
      error: e.message,
      latency_ms: Date.now() - start,
    };
  } finally {
    if (page) try { await page.close(); } catch {}
    if (browser) try { await browser.close(); } catch {}
  }
}

/**
 * Health check — launch and close browser
 */
export async function healthCheck() {
  try {
    const pw = await getPlaywright();
    const start = Date.now();
    const browser = await pw.chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('about:blank');
    await page.close();
    await browser.close();
    return { online: true, latency: Date.now() - start };
  } catch (e) {
    return { online: false, latency: -1, error: e.message };
  }
}

export default { execute, healthCheck };
