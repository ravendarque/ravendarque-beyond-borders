const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const outDir = path.resolve(__dirname, '..', 'test-results', 'inspect');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ baseURL: 'http://localhost:5173' });
  const page = await ctx.newPage();

  const logs = [];
  page.on('console', msg => {
    const text = `${msg.type()}: ${msg.text()}`;
    logs.push(text);
    console.log(text);
  });
  page.on('pageerror', err => {
    logs.push(`pageerror: ${err.toString()}`);
    console.log('pageerror:', err.toString());
  });

  try {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // capture screenshot and html
    const shotPath = path.join(outDir, 'inspect-screenshot.png');
    await page.screenshot({ path: shotPath, fullPage: true });

    const html = await page.content();
    const domPath = path.join(outDir, 'inspect-dom.html');
    fs.writeFileSync(domPath, html, 'utf8');

    const logsPath = path.join(outDir, 'inspect-console.log');
    fs.writeFileSync(logsPath, logs.join('\n'), 'utf8');

    console.log('Wrote:', shotPath);
    console.log('Wrote:', domPath);
    console.log('Wrote:', logsPath);
  } catch (err) {
    console.error('Error during inspect:', err);
  } finally {
    await browser.close();
  }
})();
