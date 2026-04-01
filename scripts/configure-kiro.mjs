import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Open OmniRoute dashboard
  await page.goto('http://localhost:20128/login');
  console.log('Opened login page');
  
  await page.waitForTimeout(1000);
  
  // Enter password
  const passwordInput = await page.$('input[type="password"]');
  if (passwordInput) {
    await passwordInput.fill('shadow-stack-2026');
    console.log('Entered password');
    
    // Click continue button
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text.includes('Continue') || text.includes('Sign in')) {
        await btn.click();
        console.log('Clicked login button');
        break;
      }
    }
  } else {
    console.log('Password input not found');
  }
  
  await page.waitForTimeout(3000);
  
  // Take screenshot after login
  await page.screenshot({ path: '/tmp/omniroute-after-login.png' });
  console.log('Screenshot after login saved');
  console.log('Current URL:', page.url());
  
  // Check if we're on dashboard
  const bodyText = await page.textContent('body');
  console.log('Page content:', bodyText?.substring(0, 1000));
  
  // Look for Kiro provider or configure button
  const links = await page.$$('a');
  for (const link of links) {
    const text = await link.textContent();
    const href = await link.getAttribute('href');
    console.log(`Link: "${text}" -> ${href}`);
  }
  
  // Look for buttons
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    console.log(`Button: "${text}"`);
  }
  
  await page.waitForTimeout(2000);
  await browser.close();
})();
