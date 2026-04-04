import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

try {
  // Login
  console.log('1. Login to OmniRoute...');
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
  console.log('   Logged in:', page.url());

  // Go to Kiro provider
  console.log('2. Navigate to Kiro provider...');
  await page.goto('http://localhost:20128/dashboard/providers/kiro');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/kiro-reconnect.png' });

  const bodyText = await page.textContent('body');
  console.log('   Page content (first 1500):');
  console.log(bodyText?.substring(0, 1500));

  // Find "Add" or "Connect" or "OAuth" button
  console.log('3. Looking for auth buttons...');
  const allBtns = await page.locator('button').all();
  for (const b of allBtns) {
    try {
      const t = await b.textContent();
      const vis = await b.isVisible();
      if (vis && t && t.trim().length > 0 && t.trim().length < 60) {
        const clean = t.trim();
        console.log(`   Button: "${clean}"`);
        if (clean.toLowerCase().includes('add') || clean.toLowerCase().includes('connect') || clean.toLowerCase().includes('oauth') || clean.toLowerCase().includes('aws') || clean.toLowerCase().includes('builder') || clean.toLowerCase().includes('login') || clean.toLowerCase().includes('authorize')) {
          console.log(`   → MATCH: "${clean}"`);
        }
      }
    } catch(e) {}
  }

  // Find all links too
  console.log('4. Looking for auth links...');
  const allLinks = await page.locator('a').all();
  for (const l of allLinks) {
    try {
      const t = await l.textContent();
      const vis = await l.isVisible();
      if (vis && t && t.trim().length > 0 && t.trim().length < 60) {
        const clean = t.trim();
        if (clean.toLowerCase().includes('kiro') || clean.toLowerCase().includes('aws') || clean.toLowerCase().includes('builder') || clean.toLowerCase().includes('oauth') || clean.toLowerCase().includes('connect') || clean.toLowerCase().includes('login')) {
          console.log(`   Link: "${clean}"`);
          const href = await l.getAttribute('href');
          console.log(`     href: ${href}`);
        }
      }
    } catch(e) {}
  }

  console.log('\n5. Waiting 60s for manual OAuth re-auth...');
  console.log('   Please click "Add" → "AWS Builder ID" → login with new account');
  await page.waitForTimeout(60000);

  // After manual auth, check if Kiro works
  console.log('\n6. Testing Kiro...');
  const resp = await page.goto('http://localhost:20128/v1/chat/completions', {
    waitUntil: 'networkidle'
  });
  
} catch (err) {
  console.error('Error:', err.message);
}

await browser.close();
