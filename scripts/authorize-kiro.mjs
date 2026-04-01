import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Login
    console.log('Logging in...');
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
    
    // Go to Kiro provider page
    console.log('Navigating to Kiro provider...');
    await page.goto('http://localhost:20128/dashboard/providers/kiro');
    await page.waitForTimeout(2000);
    
    // Find and click the "Add" button
    console.log('Looking for Add button...');
    const addBtn = await page.$('button:has-text("Add")');
    if (addBtn) {
      await addBtn.click();
      await page.waitForTimeout(3000);
      console.log('After click URL:', page.url());
      await page.screenshot({ path: '/tmp/kiro-after-add.png' });
      
      // Check for AWS Builder ID option
      const bodyText = await page.textContent('body');
      console.log('Page after Add:', bodyText?.substring(0, 1000));
    } else {
      console.log('Add button not found');
      await page.screenshot({ path: '/tmp/kiro-no-add.png' });
    }
    
    console.log('\n⚠️  Kiro авторизация требует AWS Builder ID OAuth');
    console.log('Браузер открыт 60 секунд для ручной авторизации...');
    await page.waitForTimeout(60000);
    
  } catch (err) {
    console.error('Error:', err.message);
  }
  
  await browser.close();
})();
