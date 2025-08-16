// Usage: node scripts/screenshot.js <url> <output>
// Example: node scripts/screenshot.js http://localhost:5173 preview.png

const url = process.argv[2] || 'http://localhost:5173/';
const out = process.argv[3] || 'preview-screenshot.png';

(async () => {
  try {
    const playwright = await import('playwright');
    const browser = await playwright.chromium.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.screenshot({ path: out, fullPage: true });
    await browser.close();
    console.log('screenshot saved to', out);
  } catch (err) {
    console.error('screenshot failed:', err.message || err);
    process.exit(1);
  }
})();
