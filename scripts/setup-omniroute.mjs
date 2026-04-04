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
    const btns = await page.$$('button');
    for (const b of btns) {
      const t = await b.textContent();
      if (t.includes('Continue')) { await b.click(); break; }
    }
  }
  await page.waitForTimeout(2000);
  console.log('   Logged in:', page.url());

  // Go to providers
  console.log('2. Navigate to providers...');
  await page.goto('http://localhost:20128/dashboard/providers');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/omni-providers.png' });

  const text = await page.textContent('body');
  console.log('   Page content (first 2000):');
  console.log(text?.substring(0, 2000));

  // Find all buttons
  console.log('3. Finding buttons...');
  const allBtns = await page.$$('button');
  for (const b of allBtns) {
    try {
      const t = await b.textContent();
      const vis = await b.isVisible();
      if (vis && t && t.trim().length > 0 && t.trim().length < 80) {
        console.log('   Button:', t.trim());
      }
    } catch(e) {}
  }

  // Find all links
  console.log('4. Finding links...');
  const allLinks = await page.$$('a');
  for (const l of allLinks) {
    try {
      const t = await l.textContent();
      const vis = await l.isVisible();
      if (vis && t && t.trim().length > 0 && t.trim().length < 80) {
        console.log('   Link:', t.trim());
      }
    } catch(e) {}
  }

  console.log('\n5. Waiting 30s for review...');
  await page.waitForTimeout(30000);

} catch (err) {
  console.error('Error:', err.message);
}

await browser.close();
