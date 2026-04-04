import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

const env = readFileSync('/Users/work/shadow-stack_local_1/.env', 'utf8');
const getKey = (name) => env.match(new RegExp(`${name}=["']?([^"'\n\r]+)["']?`))?.[1] || '';

const GROQ_KEY = getKey('GROQ_API_KEY');
const MISTRAL_KEY = getKey('MISTRAL_API_KEY');
const OPENROUTER_KEY = getKey('OPENROUTER_API_KEY');

async function login() {
  await page.goto('http://localhost:20128/login');
  await page.waitForTimeout(500);
  const pwd = await page.$('input[type="password"]');
  if (pwd) {
    await pwd.fill('shadow-stack-2026');
    for (const b of await page.$$('button')) {
      if ((await b.textContent()).includes('Continue')) { await b.click(); break; }
    }
  }
  await page.waitForTimeout(2000);
}

async function addProvider(name, baseUrl, apiKey) {
  console.log(`\n=== ${name} ===`);
  await page.goto('http://localhost:20128/dashboard/providers');
  await page.waitForTimeout(1500);
  
  for (const b of await page.$$('button')) {
    if ((await b.textContent()).includes('Add OpenAI Compatible')) { await b.click(); break; }
  }
  await page.waitForTimeout(2000);
  
  const textInputs = await page.locator('input[type="text"]').all();
  if (textInputs.length >= 3) {
    await textInputs[0].fill(name);
    await textInputs[2].fill(baseUrl);
  }
  await page.locator('input[type="password"]').fill(apiKey);
  await page.waitForTimeout(1000);
  
  // Look for a Save/Confirm button specifically
  const allBtns = await page.locator('button').all();
  let foundSave = false;
  for (const b of allBtns) {
    try {
      const t = await b.textContent();
      const vis = await b.isVisible();
      if (vis && t) {
        const clean = t.replace(/[^\w\s]/g, '').trim().toLowerCase();
        if (clean === 'save' || clean === 'confirm' || clean === 'add' || clean === 'connect' || clean === 'submit') {
          // Make sure it's NOT the "Add OpenAI Compatible" button
          if (!t.includes('Add OpenAI') && !t.includes('Add Anthropic')) {
            await b.click();
            console.log(`  Clicked: "${t.trim()}"`);
            foundSave = true;
            break;
          }
        }
      }
    } catch(e) {}
  }
  
  if (!foundSave) {
    // Try clicking the checkmark icon button
    const iconBtns = await page.locator('button:has(svg)').all();
    for (const b of iconBtns) {
      try {
        const vis = await b.isVisible();
        if (vis) {
          const t = await b.textContent();
          if (!t || t.trim().length === 0 || t.trim().length < 5) {
            await b.click();
            console.log('  Clicked icon button');
            foundSave = true;
            break;
          }
        }
      } catch(e) {}
    }
  }
  
  if (!foundSave) {
    await page.keyboard.press('Enter');
    console.log('  Pressed Enter');
  }
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `/tmp/omni-v6-${name}.png` });
}

try {
  await login();
  
  if (GROQ_KEY) await addProvider('Groq', 'https://api.groq.com/openai/v1', GROQ_KEY);
  if (MISTRAL_KEY) await addProvider('Mistral', 'https://api.mistral.ai/v1', MISTRAL_KEY);
  if (OPENROUTER_KEY) await addProvider('OpenRouter', 'https://openrouter.ai/api/v1', OPENROUTER_KEY);
  
  // After adding all, click "Test all API Key connections"
  console.log('\n=== Testing all API Key connections ===');
  await page.waitForTimeout(2000);
  const allBtns = await page.locator('button').all();
  for (const b of allBtns) {
    try {
      const t = await b.textContent();
      if (t && t.includes('Test all API Key')) {
        await b.click();
        console.log('  Clicked Test all API Key connections');
        break;
      }
    } catch(e) {}
  }
  
  await page.waitForTimeout(10000);
  await page.screenshot({ path: '/tmp/omni-v6-after-test.png' });
  
  console.log('\n=== Final Models ===');
  const resp = await page.goto('http://localhost:20128/v1/models');
  const data = await resp.json();
  console.log(`Total: ${data.data?.length || 0}`);
  for (const m of data.data || []) console.log(`  ${m.id}`);
  
  await page.waitForTimeout(10000);
} catch (err) {
  console.error('Error:', err.message);
}

await browser.close();
