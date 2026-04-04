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
  
  // Click Add
  for (const b of await page.$$('button')) {
    if ((await b.textContent()).includes('Add OpenAI Compatible')) { await b.click(); break; }
  }
  await page.waitForTimeout(2000);
  
  // Fill fields
  await page.locator('input[type="text"]').first().fill(name);
  await page.locator('input[type="text"]').nth(2).fill(baseUrl);
  await page.locator('input[type="password"]').fill(apiKey);
  await page.waitForTimeout(1000);
  
  // Try clicking Test first
  const testBtn = page.getByRole('button', { name: 'Test' });
  if (await testBtn.isVisible()) {
    await testBtn.click();
    console.log('  Clicked Test...');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: `/tmp/omni-v4-${name}-test.png` });
    
    // Check test result
    const bodyText = await page.textContent('body');
    if (bodyText?.includes('success') || bodyText?.includes('Success') || bodyText?.includes('200') || bodyText?.includes('OK')) {
      console.log('  ✅ Test passed!');
    } else {
      console.log('  Test result:', bodyText?.substring(bodyText?.indexOf('success') - 50, bodyText?.indexOf('success') + 100) || 'no result');
    }
  }
  
  // After test, look for Save button
  const allBtns = await page.locator('button').all();
  for (const b of allBtns) {
    try {
      const t = await b.textContent();
      const vis = await b.isVisible();
      if (vis && t && (t.trim() === 'Save' || t.trim() === 'save' || t.includes('Confirm'))) {
        await b.click();
        console.log(`  Clicked: ${t.trim()}`);
        break;
      }
    } catch(e) {}
  }
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `/tmp/omni-v4-${name}-done.png` });
}

try {
  await login();
  if (GROQ_KEY) await addProvider('Groq', 'https://api.groq.com/openai/v1', GROQ_KEY);
  if (MISTRAL_KEY) await addProvider('Mistral', 'https://api.mistral.ai/v1', MISTRAL_KEY);
  if (OPENROUTER_KEY) await addProvider('OpenRouter', 'https://openrouter.ai/api/v1', OPENROUTER_KEY);
  
  console.log('\n=== Final Models ===');
  await page.waitForTimeout(2000);
  const resp = await page.goto('http://localhost:20128/v1/models');
  const data = await resp.json();
  console.log(`Total: ${data.data?.length || 0}`);
  for (const m of data.data || []) console.log(`  ${m.id}`);
  
  await page.waitForTimeout(10000);
} catch (err) {
  console.error('Error:', err.message);
}

await browser.close();
