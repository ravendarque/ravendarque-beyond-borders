import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  // seed localStorage before any script runs
  await context.addInitScript(() => {
    try { window.localStorage.setItem('bb_selectedFlag', 'ps'); } catch (e) {}
  });
  const page = await context.newPage();
  try {
    const url = process.env.APP_URL || 'http://localhost:5173/?testMode=forceFlag';
    console.log('goto', url);
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    // Ensure localStorage is set in-page and reload so the app's effect picks it up
    try {
      await page.evaluate(() => { try { window.localStorage.setItem('bb_selectedFlag', 'ps'); } catch {} });
      await page.reload({ waitUntil: 'load' });
    } catch (e) {
      // ignore
    }
    // wait for app to settle; poll for debug payload up to 5s
    const maxMs = 5000;
    const start = Date.now();
    let dbg = [];
    // report some app state to help diagnose why draw() may not run
    const state = await page.evaluate(() => {
      try {
        const inputMode = (window && window.__bb_internal_inputMode) ? window.__bb_internal_inputMode : (document.querySelector('[aria-label="Flag selection"]') ? 'unknown' : null);
        const flagId = (window && window.localStorage) ? window.localStorage.getItem('bb_selectedFlag') : null;
        let selected = null;
        try {
          const el = document.querySelector('img[alt]');
          if (el && el.src) selected = el.src;
          else if (el && (el).currentSrc) selected = (el).currentSrc;
        } catch {
        }
        return { inputMode, flagId, selectedFlag_src: selected };
      } catch (e) { return { inputMode: null, flagId: null, selectedFlag_src: null }; }
    });
    console.log('initial page state:', JSON.stringify(state));
    // Interact with the UI to ensure flag mode + selection active
    try {
      // click Flag mode button
      await page.click('button:has-text("Flag mode")');
      await page.waitForTimeout(200);
      // open select
      await page.click('[role="combobox"]');
      await page.waitForTimeout(200);
      // click the Palestine menu item by text
      await page.click('text=Palestine');
      await page.waitForTimeout(500);
    } catch (e) {
      // ignore errors in interaction
    }

    while (Date.now() - start < maxMs) {
      dbg = await page.evaluate(() => (window.__BB_DEBUG__ || []).slice(0, 200));
      if (Array.isArray(dbg) && dbg.length > 0) break;
      await page.waitForTimeout(250);
    }
    console.log('BB_DEBUG length=', Array.isArray(dbg) ? dbg.length : 'non-array');
    console.log(JSON.stringify(dbg, null, 2));
    // also report preview canvas size and overlay img src
    const info = await page.evaluate(() => {
      const canv = document.querySelector('canvas[role="img"]');
      const overlay = document.querySelector('img.css-1akidri, img.css-tp70ey');
      return {
        canvasWidth: canv ? canv.width : null,
        canvasHeight: canv ? canv.height : null,
        overlaySrc: overlay ? overlay.currentSrc || overlay.src : null,
        overlayVisible: overlay ? !!(overlay.offsetWidth || overlay.offsetHeight) : false,
      };
    });
    console.log('preview info:', JSON.stringify(info));
  } catch (err) {
    console.error('error', err);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();
