const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { Resvg } = require('@resvg/resvg-js');

async function renderWithResvg(svgPath, outPath, width, height, mode = 'cover'){
  const svg = fs.readFileSync(svgPath, 'utf8');
  // resvg can render at exact pixel width/height by setting the 'fitTo' option
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } });
  // Render at width; resvg returns PNG buffer
  let png = resvg.render().asPng();
  // Use sharp to enforce height/cover behavior
  const img = await sharp(png).resize(width, height, { fit: mode === 'cover' ? 'cover' : 'contain', background: { r:0,g:0,b:0, alpha: 0 } }).png().toBuffer();
  fs.writeFileSync(outPath, img);
}

(async ()=>{
  const flagsDir = path.resolve(__dirname, '..', 'public', 'flags');
  const tests = [
    { id: 'iran', svg: path.join(flagsDir, 'iran.svg') },
    { id: 'the-sahrawi-arab-democratic-republic', svg: path.join(flagsDir, 'the-sahrawi-arab-democratic-republic.svg') }
  ];
  const FULL_HEIGHT = 1365;
  for (const t of tests) {
    if (!fs.existsSync(t.svg)) { console.warn('SVG missing', t.svg); continue; }
    const aspectMatch = fs.readFileSync(t.svg, 'utf8').match(/viewBox\s*=\s*"([0-9\.\-]+)\s+([0-9\.\-]+)\s+([0-9\.\-]+)\s+([0-9\.\-]+)"/i);
    let aspect = 3/2;
    if (aspectMatch) { const w = parseFloat(aspectMatch[3]); const h = parseFloat(aspectMatch[4]); if (w>0 && h>0) aspect = w/h; }
    const width = Math.max(64, Math.round(FULL_HEIGHT * aspect));
    const out = path.join(flagsDir, t.id + '.resvg.test.png');
    console.log('Rendering', t.id, '->', out, width, 'x', FULL_HEIGHT);
    await renderWithResvg(t.svg, out, width, FULL_HEIGHT, 'cover');
    console.log('Wrote', out);
  }
})();
