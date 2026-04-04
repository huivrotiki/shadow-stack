import { chromium } from 'playwright';

// Connect via 127.0.0.1
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const context = browser.contexts()[0];
const pages = await context.pages();
let page = pages[0] || await context.newPage();

try {
  console.log('1. Login to OmniRoute...');
  await page.goto('http://localhost:20128/login');
  await page.waitForTimeout(1000);
  
  const pwd = await page.$('input[type="password"]');
  if (pwd) {
    await pwd.fill('shadow-stack-2026');
    for (const b of await page.$$('button')) {
      if ((await b.textContent()).includes('Continue')) { await b.click(); break; }
    }
  }
  await page.waitForTimeout(2000);
  console.log('   Logged in:', page.url());

  console.log('2. Navigate to Kiro provider...');
  await page.goto('http://localhost:20128/dashboard/providers/kiro');
  await page.waitForTimeout(2000);

  console.log('3. Click Add Connection...');
  const allBtns = await page.locator('button').all();
  for (const b of allBtns) {
    try {
      const t = await b.textContent();
      if (t && t.includes('Add Connection')) {
        await b.click();
        console.log('   Clicked Add Connection');
        break;
      }
    } catch(e) {}
  }
  await page.waitForTimeout(3000);

  console.log('4. Looking for Connect Kiro / AWS Builder ID...');
  const modalBtns = await page.locator('button').all();
  for (const b of modalBtns) {
    try {
      const t = await b.textContent();
      const vis = await b.isVisible();
      if (vis && t) {
        const clean = t.trim();
        console.log(`   Button: "${clean}"`);
        if (clean.toLowerCase().includes('connect kiro') || 
            clean.toLowerCase().includes('aws builder') || 
            clean.toLowerCase().includes('oauth') ||
            clean.toLowerCase().includes('authorize')) {
          console.log(`   → MATCH: "${clean}"`);
          
          const pagesBefore = await context.pages();
          await b.click();
          console.log('   Clicked! Waiting...');
          await page.waitForTimeout(5000);
          
          const pagesAfter = await context.pages();
          console.log(`   Pages: ${pagesBefore.length} → ${pagesAfter.length}`);
          
          if (pagesAfter.length > pagesBefore.length) {
            const newPage = pagesAfter[pagesAfter.length - 1];
            console.log('   New tab URL:', newPage.url());
            await newPage.screenshot({ path: '/tmp/kiro-oauth-tab.png' });
            console.log('\n   ⏳ Waiting 60s for OAuth...');
            await page.waitForTimeout(60000);
            console.log('   Current URL:', newPage.url());
            await newPage.screenshot({ path: '/tmp/kiro-after-oauth.png' });
          } else {
            await page.waitForTimeout(30000);
          }
          break;
        }
      }
    } catch(e) {}
  }

} catch (err) {
  console.error('Error:', err.message);
}

console.log('\nDone. Chrome stays open.');
