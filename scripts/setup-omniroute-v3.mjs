import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

const env = readFileSync('/Users/work/shadow-stack_local_1/.env', 'utf8');
const getKey = (name) => {
  const m = env.match(new RegExp(`${name}=["']?([^"'\n\r]+)["']?`));
  return m ? m[1] : '';
};

const GROQ_KEY = getKey('GROQ_API_KEY');
const MISTRAL_KEY = getKey('MISTRAL_API_KEY');
const OPENROUTER_KEY = getKey('OPENROUTER_API_KEY');

async function login() {
  await page.goto('http://localhost:20128/login');
  await page.waitForTimeout(500);
  const pwd = await page.$('input[type="password"]');
  if (pwd) {
    await pwd.fill('shadow-stack-2026');
    const btns = await page.$$('button');
    for (const b of btns) {
      const t = await b.textContent();
      if (t.includes('Continue')) { await b.click(); break; }
    }
  }
  await page.waitForTimeout(2000);
}

async function addProvider(name, baseUrl, apiKey) {
  console.log(`\n=== ${name} ===`);
  
  await page.goto('http://localhost:20128/dashboard/providers');
  await page.waitForTimeout(1500);
  
  // Click "Add OpenAI Compatible"
  const addBtns = await page.$$('button');
  for (const b of addBtns) {
    const t = await b.textContent();
    if (t.includes('Add OpenAI Compatible')) {
      await b.click();
      break;
    }
  }
  await page.waitForTimeout(2000);
  
  // Fill fields - use locators for precision
  // Display Name (first text input)
  const displayName = page.locator('input[type="text"]').first();
  await displayName.fill(name);
  console.log(`  Name: ${name}`);
  
  // Base URL (third text input, after label)
  const baseUrlInput = page.locator('input[type="text"]').nth(2);
  await baseUrlInput.fill(baseUrl);
  console.log(`  URL: ${baseUrl}`);
  
  // API Key (password input)
  const keyInput = page.locator('input[type="password"]');
  await keyInput.fill(apiKey);
  console.log(`  Key: ${apiKey.slice(0,8)}...`);
  
  await page.waitForTimeout(500);
  
  // Click Save button - find by text "Save" in the modal
  // The Save button is typically a button with text "Save" or containing a checkmark
  const saveBtn = page.getByRole('button', { name: 'Save' });
  if (await saveBtn.isVisible()) {
    await saveBtn.click();
    console.log('  Clicked Save');
  } else {
    // Fallback: find button with checkmark icon
    const allBtns = await page.locator('button').all();
    for (const b of allBtns) {
      try {
        const t = await b.textContent();
        const vis = await b.isVisible();
        if (vis && t && t.trim() === 'Save') {
          await b.click();
          console.log('  Clicked Save (fallback)');
          break;
        }
      } catch(e) {}
    }
  }
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `/tmp/omni-v3-${name}.png` });
  
  // Check if modal closed (means save worked)
  const modalVisible = await page.locator('[role="dialog"], .modal, [class*="modal"]').first().isVisible().catch(() => false);
  console.log(`  Modal still open: ${modalVisible}`);
}

try {
  await login();
  
  if (GROQ_KEY) await addProvider('Groq', 'https://api.groq.com/openai/v1', GROQ_KEY);
  if (MISTRAL_KEY) await addProvider('Mistral', 'https://api.mistral.ai/v1', MISTRAL_KEY);
  if (OPENROUTER_KEY) await addProvider('OpenRouter', 'https://openrouter.ai/api/v1', OPENROUTER_KEY);
  
  // Final check
  console.log('\n=== Models ===');
  await page.waitForTimeout(2000);
  const resp = await page.goto('http://localhost:20128/v1/models');
  const data = await resp.json();
  console.log(`Total: ${data.data?.length || 0}`);
  for (const m of data.data || []) {
    console.log(`  ${m.id}`);
  }
  
  await page.waitForTimeout(10000);
} catch (err) {
  console.error('Error:', err.message);
}

await browser.close();
