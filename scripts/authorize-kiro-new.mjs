import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

try {
  // Login
  console.log('1. Login...');
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

  // Go to Kiro provider
  console.log('2. Go to Kiro provider...');
  await page.goto('http://localhost:20128/dashboard/providers/kiro');
  await page.waitForTimeout(2000);
  
  // Click "Add" button
  console.log('3. Click Add...');
  const addBtns = await page.locator('button').all();
  for (const b of addBtns) {
    try {
      const t = await b.textContent();
      if (t && t.trim() === 'Add') {
        await b.click();
        console.log('   Clicked Add');
        break;
      }
    } catch(e) {}
  }
  await page.waitForTimeout(2000);
  
  // Look for "Connect Kiro" or "AWS Builder ID" button
  console.log('4. Looking for Connect Kiro...');
  const allBtns = await page.locator('button').all();
  for (const b of allBtns) {
    try {
      const t = await b.textContent();
      const vis = await b.isVisible();
      if (vis && t) {
        const clean = t.trim();
        console.log(`   Button: "${clean}"`);
        if (clean.toLowerCase().includes('connect') || clean.toLowerCase().includes('aws') || clean.toLowerCase().includes('builder') || clean.toLowerCase().includes('oauth') || clean.toLowerCase().includes('authorize') || clean.toLowerCase().includes('login')) {
          console.log(`   → MATCH: "${clean}"`);
          await b.click();
          console.log('   Clicked!');
          await page.waitForTimeout(5000);
          await page.screenshot({ path: '/tmp/kiro-oauth.png' });
          break;
        }
      }
    } catch(e) {}
  }
  
  // Also check for "Import Token" option
  console.log('5. Checking for Import Token...');
  const importBtn = await page.$('button:has-text("Import Token"), button:has-text("Import"), button:has-text("Paste")');
  if (importBtn) {
    const vis = await importBtn.isVisible();
    if (vis) {
      console.log('   Found Import Token button');
    }
  }
  
  // Wait for user to complete OAuth
  console.log('\n6. Waiting 90s for OAuth...');
  console.log('   Please complete AWS Builder ID login with new account');
  await page.waitForTimeout(90000);
  
  // Check if Kiro connection appeared
  console.log('\n7. Checking DB...');
  
} catch (err) {
  console.error('Error:', err.message);
}

await browser.close();
