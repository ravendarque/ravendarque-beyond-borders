#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
(async () => {
  const args = process.argv.slice(2);
  if (!args[0]) {
    console.error('Usage: node scripts/inspect-flag-raster.cjs <path/to/png>');
    process.exit(2);
  }
  const file = path.resolve(process.cwd(), args[0]);
  if (!fs.existsSync(file)) {
    console.error('File not found:', file);
    process.exit(2);
  }
  let playwright;
  try { playwright = require('playwright'); } catch (e) { console.error('Playwright not installed'); process.exit(2); }
  const chromium = playwright.chromium;
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1200, height: 800 } });
  const page = await context.newPage();
  const buf = fs.readFileSync(file);
  const b64 = buf.toString('base64');
  const mime = 'image/png';
  const dataUrl = `data:${mime};base64,${b64}`;
  const html = `<!doctype html><html><body style="margin:0"><img id=img src="${dataUrl}"></body></html>`;
  await page.setContent(html);
  await page.waitForSelector('#img');
  const res = await page.evaluate(async () => {
    const img = document.getElementById('img');
    await new Promise((r) => { if (img.complete) r(); else img.onload = r; });
    const w = img.naturalWidth, h = img.naturalHeight;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d'); ctx.clearRect(0,0,w,h); ctx.drawImage(img,0,0);
    const data = ctx.getImageData(0,0,w,h).data;
    let minX = w, minY = h, maxX = 0, maxY = 0, any=false;
    for (let y=0;y<h;y++){
      for (let x=0;x<w;x++){
        const i = (y*w + x)*4;
        const a = data[i+3];
        if (a>8) {
          any = true;
          if (x<minX) minX=x;
          if (x>maxX) maxX=x;
          if (y<minY) minY=y;
          if (y>maxY) maxY=y;
        }
      }
    }
    if (!any) return { w,h, any:false };
    const usedW = maxX - minX + 1; const usedH = maxY - minY + 1;
    return { w,h, any:true, minX,minY,maxX,maxY, usedW, usedH, pctW: usedW/w, pctH: usedH/h };
  });
  console.log('Inspect result for', file);
  console.log(JSON.stringify(res, null, 2));
  await browser.close();
})();
