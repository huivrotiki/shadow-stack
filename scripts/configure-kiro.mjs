import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Step 1: Login to OmniRoute
    console.log('Step 1: Login to OmniRoute...');
    await page.goto('http://localhost:20128/login');
    await page.waitForTimeout(1000);
    
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      await passwordInput.fill('shadow-stack-2026');
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text.includes('Continue') || text.includes('Sign in')) {
          await btn.click();
          break;
        }
      }
    }
    await page.waitForTimeout(2000);
    console.log('Logged in. Current URL:', page.url());
    
    // Step 2: Navigate to providers
    console.log('Step 2: Navigate to providers...');
    await page.goto('http://localhost:20128/dashboard/providers');
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/omniroute-providers.png' });
    console.log('Screenshot saved: /tmp/omniroute-providers.png');
    
    // Get page content
    const bodyText = await page.textContent('body');
    console.log('Page content:', bodyText?.substring(0, 1500));
    
    // Look for Kiro or "Add Provider" buttons
    const buttons = await page.$$('button, a');
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text && (text.toLowerCase().includes('kiro') || text.toLowerCase().includes('add') || text.toLowerCase().includes('configure') || text.toLowerCase().includes('provider'))) {
        console.log('Found button:', text);
      }
    }
    
    // Step 3: Try to find Kiro provider page
    console.log('Step 3: Check Kiro provider...');
    await page.goto('http://localhost:20128/dashboard/providers/kiro');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/omniroute-kiro.png' });
    
    const kiroText = await page.textContent('body');
    console.log('Kiro page:', kiroText?.substring(0, 1000));
    
    // Look for AWS Builder ID button
    const allButtons = await page.$$('button, a, [role="button"]');
    for (const btn of allButtons) {
      const text = await btn.textContent();
      if (text && (text.toLowerCase().includes('aws') || text.toLowerCase().includes('builder') || text.toLowerCase().includes('login') || text.toLowerCase().includes('connect') || text.toLowerCase().includes('authorize'))) {
        console.log('Found auth button:', text);
        const href = await btn.getAttribute('href');
        console.log('  href:', href);
      }
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
  
  await page.waitForTimeout(3000);
  await browser.close();
})();
