import { chromium } from 'playwright';

// Connect to existing Chrome with CDP
const browser = await chromium.connectOverCDP('http://localhost:9222');
const context = browser.contexts()[0];
const pages = await context.pages();
let page = pages[0] || await context.newPage();

try {
  // Step 1: Login to OmniRoute
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

  // Step 2: Navigate to Kiro provider
  console.log('2. Navigate to Kiro provider...');
  await page.goto('http://localhost:20128/dashboard/providers/kiro');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/kiro-before-oauth.png' });

  // Step 3: Click "Add Connection" button
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
  await page.screenshot({ path: '/tmp/kiro-modal.png' });

  // Step 4: Find and click "Connect Kiro" or "AWS Builder ID"
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
            clean.toLowerCase().includes('authorize') ||
            clean.toLowerCase().includes('login with')) {
          console.log(`   → MATCH: "${clean}"`);
          
          // Get all windows before click
          const pagesBefore = await context.pages();
          
          await b.click();
          console.log('   Clicked! Waiting for new tab...');
          
          // Wait for new tab (OAuth popup)
          await page.waitForTimeout(5000);
          
          // Check for new tabs
          const pagesAfter = await context.pages();
          console.log(`   Pages: ${pagesBefore.length} → ${pagesAfter.length}`);
          
          if (pagesAfter.length > pagesBefore.length) {
            const newPage = pagesAfter[pagesAfter.length - 1];
            console.log('   New tab URL:', newPage.url());
            await newPage.screenshot({ path: '/tmp/kiro-oauth-tab.png' });
            
            // Wait for user to complete OAuth in the new tab
            console.log('\n   ⏳ Waiting 60s for OAuth completion...');
            console.log('   Please complete AWS Builder ID login in the new tab');
            await page.waitForTimeout(60000);
            
            // After OAuth, check if we're back on OmniRoute
            console.log('   Current URL:', newPage.url());
            await newPage.screenshot({ path: '/tmp/kiro-after-oauth.png' });
          } else {
            // Maybe it opened in same tab or didn't open
            console.log('   No new tab. Current URL:', page.url());
            await page.screenshot({ path: '/tmp/kiro-same-tab.png' });
            await page.waitForTimeout(30000);
          }
          break;
        }
      }
    } catch(e) {}
  }

  // Step 5: Check if Kiro connection appeared
  console.log('\n5. Checking DB...');
  
} catch (err) {
  console.error('Error:', err.message);
}

// Don't close browser - it's the user's Chrome
console.log('\nDone. Chrome stays open.');
