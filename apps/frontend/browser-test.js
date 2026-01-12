const puppeteer = require('puppeteer');

let browser;
let page;

async function launchBrowser(url) {
  console.log(`Launching browser and navigating to ${url}...`);

  browser = await puppeteer.launch({
    executablePath: '/run/current-system/sw/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  console.log('Page loaded successfully.');
}

async function takeScreenshot() {
  const screenshotPath = `screenshot-${Date.now()}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved to ${screenshotPath}`);
  return screenshotPath;
}

async function run() {
  const args = process.argv.slice(2);
  const action = args[0];

  try {
    if (action === 'launch') {
      const url = args[1];
      if (!url) {
        console.error('Usage: node browser-test.js launch <url>');
        process.exit(1);
      }
      await launchBrowser(url);
      await takeScreenshot();
      const title = await page.title();
      console.log(`Page title: ${title}`);

    } else if (action === 'click') {
      const selector = args[1];
      if (!page || !selector) {
        console.error('Browser not launched or selector missing. Use launch first.');
        process.exit(1);
      }
      console.log(`Clicking element: ${selector}`);
      await page.click(selector);
      await takeScreenshot();

    } else if (action === 'type') {
      const selector = args[1];
      const text = args[2];
      if (!page || !selector || text === undefined) {
        console.error('Browser not launched or selector/text missing.');
        process.exit(1);
      }
      console.log(`Typing "${text}" into: ${selector}`);
      await page.type(selector, text);
      await takeScreenshot();

    } else if (action === 'close') {
      if (browser) {
        await browser.close();
        console.log('Browser closed.');
      }

    } else {
      console.error('Unknown action. Supported: launch, click, type, close');
    }
  } finally {
    if (browser && action !== 'close') {
      // Keep browser open for multiple actions, close only on explicit close
    }
  }
}

run().catch(console.error);