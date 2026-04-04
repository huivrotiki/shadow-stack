import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

// Read keys from .env
import { readFileSync } from 'fs';
const env = readFileSync('/Users/work/shadow-stack_local_1/.env', 'utf8');
const getKey = (name) => {
  const m = env.match(new RegExp(`${name}=["']?([^"'\n\r]+)["']?`));
  return m ? m[1] : '';
};

const GROQ_KEY = getKey('GROQ_API_KEY');
const MISTRAL_KEY = getKey('MISTRAL_API_KEY');
const ZEN_KEY = getKey('ZEN_API_KEY') || getKey('OPENCODE_ZEN_KEY');
const OPENROUTER_KEY = getKey('OPENROUTER_API_KEY');

console.log('Keys loaded:', {
  GROQ_KEY: GROQ_KEY ? `${GROQ_KEY.slice(0,8)}...` : 'MISSING',
  MISTRAL_KEY: MISTRAL_KEY ? `${MISTRAL_KEY.slice(0,8)}...` : 'MISSING',
  ZEN_KEY: ZEN_KEY ? `${ZEN_KEY.slice(0,8)}...` : 'MISSING',
  OPENROUTER_KEY: OPENROUTER_KEY ? `${OPENROUTER_KEY.slice(0,8)}...` : 'MISSING',
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
  console.log('  Logged in:', page.url());
}

async function addOpenAIProvider(name, baseUrl, apiKey, models) {
  console.log(`\nAdding OpenAI provider: ${name}...`);
  
  // Go to providers page
  await page.goto('http://localhost:20128/dashboard/providers');
  await page.waitForTimeout(1000);
  
  // Click "Add OpenAI Compatible"
  const btns = await page.$$('button');
  for (const b of btns) {
    const t = await b.textContent();
    if (t.includes('Add OpenAI Compatible')) {
      await b.click();
      break;
    }
  }
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `/tmp/omni-modal-${name}.png` });
  
  // Fill form fields
  const inputs = await page.$$('input');
  for (const input of inputs) {
    const placeholder = (await input.getAttribute('placeholder') || '').toLowerCase();
    const type = await input.getAttribute('type');
    
    if (placeholder.includes('name') || placeholder.includes('label')) {
      await input.fill(name);
      console.log(`  Filled name: ${name}`);
    } else if (placeholder.includes('url') || placeholder.includes('base') || placeholder.includes('endpoint')) {
      await input.fill(baseUrl);
      console.log(`  Filled URL: ${baseUrl}`);
    } else if (placeholder.includes('key') || placeholder.includes('token') || placeholder.includes('api') || type === 'password') {
      await input.fill(apiKey);
      console.log(`  Filled API key`);
    }
  }
  
  // Fill models if there's a models field
  if (models) {
    const textareas = await page.$$('textarea');
    for (const ta of textareas) {
      const placeholder = (await ta.getAttribute('placeholder') || '').toLowerCase();
      if (placeholder.includes('model') || placeholder.includes('comma')) {
        await ta.fill(models);
        console.log(`  Filled models: ${models}`);
      }
    }
  }
  
  // Click Save/Add
  await page.waitForTimeout(1000);
  const saveBtns = await page.$$('button');
  for (const b of saveBtns) {
    const t = await b.textContent();
    if (t.includes('Save') || t.includes('Add') || t.includes('Connect') || t.includes('Submit')) {
      await b.click();
      console.log(`  Clicked ${t.trim()}`);
      break;
    }
  }
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `/tmp/omni-after-${name}.png` });
}

try {
  await login();
  
  // Add Groq
  if (GROQ_KEY) {
    await addOpenAIProvider('Groq', 'https://api.groq.com/openai/v1', GROQ_KEY, 'llama-3.3-70b-versatile');
  }
  
  // Add Mistral
  if (MISTRAL_KEY) {
    await addOpenAIProvider('Mistral', 'https://api.mistral.ai/v1', MISTRAL_KEY, 'mistral-small-latest');
  }
  
  // Add OpenCode Zen
  if (ZEN_KEY) {
    await addOpenAIProvider('OpenCode Zen', 'https://opencode.ai/zen/v1', ZEN_KEY, 'big-pickle,qwen3.6-plus-free,nemotron-3-super-free');
  }
  
  // Add Ollama Cloud
  await addOpenAIProvider('Ollama Cloud', 'http://localhost:11434/v1', '', 'qwen2.5-coder:3b,qwen2.5:7b');
  
  console.log('\n✅ All providers added!');
  console.log('Waiting 30s for review...');
  await page.waitForTimeout(30000);
  
} catch (err) {
  console.error('Error:', err.message);
}

await browser.close();
