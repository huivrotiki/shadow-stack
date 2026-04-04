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
  
  // Click Add OpenAI Compatible
  for (const b of await page.$$('button')) {
    if ((await b.textContent()).includes('Add OpenAI Compatible')) { await b.click(); break; }
  }
  await page.waitForTimeout(2000);
  
  // Fill fields
  const textInputs = await page.locator('input[type="text"]').all();
  console.log(`  Text inputs: ${textInputs.length}`);
  if (textInputs.length >= 3) {
    await textInputs[0].fill(name);
    console.log(`  Name: ${name}`);
    await textInputs[2].fill(baseUrl);
    console.log(`  URL: ${baseUrl}`);
  }
  
  const pwdInput = page.locator('input[type="password"]');
  await pwdInput.fill(apiKey);
  console.log(`  Key: ${apiKey.slice(0,8)}...`);
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `/tmp/omni-v5-${name}-filled.png` });
  
  // Try pressing Enter to submit (common pattern for modals)
  await page.keyboard.press('Enter');
  console.log('  Pressed Enter');
  await page.waitForTimeout(3000);
  
  // Check if modal closed
  const overlay = page.locator('div[class*="backdrop"], div[class*="overlay"], div[class*="fixed"][class*="inset"]').first();
  const modalOpen = await overlay.isVisible().catch(() => false);
  console.log(`  Modal open after Enter: ${modalOpen}`);
  
  if (modalOpen) {
    // Try Escape to close (might auto-save)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(2000);
    console.log('  Pressed Escape');
  }
  
  await page.screenshot({ path: `/tmp/omni-v5-${name}-after.png` });
}

try {
  await login();
  
  if (GROQ_KEY) await addProvider('Groq', 'https://api.groq.com/openai/v1', GROQ_KEY);
  if (MISTRAL_KEY) await addProvider('Mistral', 'https://api.mistral.ai/v1', MISTRAL_KEY);
  if (OPENROUTER_KEY) await addProvider('OpenRouter', 'https://openrouter.ai/api/v1', OPENROUTER_KEY);
  
  console.log('\n=== Final Models ===');
  await page.waitForTimeout(3000);
  const resp = await page.goto('http://localhost:20128/v1/models');
  const data = await resp.json();
  console.log(`Total: ${data.data?.length || 0}`);
  for (const m of data.data || []) console.log(`  ${m.id}`);
  
  await page.waitForTimeout(10000);
} catch (err) {
  console.error('Error:', err.message);
}

await browser.close();
