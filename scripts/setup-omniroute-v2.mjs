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

console.log('Keys:', {
  GROQ: GROQ_KEY ? '✅' : '❌',
  MISTRAL: MISTRAL_KEY ? '✅' : '❌',
  OPENROUTER: OPENROUTER_KEY ? '✅' : '❌',
});

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
  console.log(`\n=== Adding: ${name} ===`);
  
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
  
  // Now we're in a modal - find all inputs
  const inputs = await page.$$('input');
  console.log(`  Found ${inputs.length} inputs`);
  
  for (const input of inputs) {
    const placeholder = (await input.getAttribute('placeholder') || '').toLowerCase();
    const type = await input.getAttribute('type');
    const name_attr = await input.getAttribute('name');
    const id_attr = await input.getAttribute('id');
    
    console.log(`  Input: placeholder="${placeholder}" type="${type}" name="${name_attr}" id="${id_attr}"`);
    
    if (placeholder.includes('name') || placeholder.includes('display') || placeholder.includes('label')) {
      await input.fill(name);
      console.log(`    → Filled name: ${name}`);
    } else if (placeholder.includes('url') || placeholder.includes('base') || placeholder.includes('endpoint') || placeholder.includes('api')) {
      await input.fill(baseUrl);
      console.log(`    → Filled URL: ${baseUrl}`);
    } else if (type === 'password' || placeholder.includes('key') || placeholder.includes('token') || placeholder.includes('secret') || placeholder.includes('api key')) {
      await input.fill(apiKey);
      console.log(`    → Filled API key`);
    }
  }
  
  // Wait for modal to render
  await page.waitForTimeout(1000);
  
  // Find save button in modal - use role-based locator
  const modalBtns = await page.locator('button').all();
  for (const b of modalBtns) {
    try {
      const t = await b.textContent();
      const vis = await b.isVisible();
      if (vis && t && (t.includes('Save') || t.includes('Add') || t.includes('Connect'))) {
        await b.click({ force: true });
        console.log(`    → Clicked: ${t.trim()}`);
        break;
      }
    } catch(e) {}
  }
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `/tmp/omni-${name.replace(/\s/g,'-')}.png` });
  console.log(`  Screenshot saved`);
}

try {
  await login();
  
  if (GROQ_KEY) await addProvider('Groq', 'https://api.groq.com/openai/v1', GROQ_KEY);
  if (MISTRAL_KEY) await addProvider('Mistral', 'https://api.mistral.ai/v1', MISTRAL_KEY);
  if (OPENROUTER_KEY) await addProvider('OpenRouter', 'https://openrouter.ai/api/v1', OPENROUTER_KEY);
  
  // Check final state
  console.log('\n=== Final check ===');
  await page.waitForTimeout(2000);
  const resp = await page.goto('http://localhost:20128/v1/models');
  const data = await resp.json();
  console.log(`Total models: ${data.data?.length || 0}`);
  for (const m of data.data || []) {
    console.log(`  ${m.id}`);
  }
  
  console.log('\nDone! Waiting 30s...');
  await page.waitForTimeout(30000);
  
} catch (err) {
  console.error('Error:', err.message);
}

await browser.close();
