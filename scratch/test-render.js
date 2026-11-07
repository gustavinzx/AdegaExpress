const { chromium } = require('c:/Users/gsds0/Desktop/Adega Express/adega-express-backend/node_modules/playwright');
const path = require('path');

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  await page.waitForTimeout(1000);
  const title = await page.title();
  console.log('Page Title:', title);
  
  const testScreenshotPath = path.resolve(__dirname, 'test-home.png');
  await page.screenshot({ path: testScreenshotPath, fullPage: false });
  console.log('Saved screenshot to:', testScreenshotPath);
  
  await browser.close();
}

main().catch(err => {
  console.error('Error running test script:', err);
  process.exit(1);
});
