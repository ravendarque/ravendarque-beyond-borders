const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');
const { Resvg } = require('@resvg/resvg-js');

function fetchToBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchToBuffer(res.headers.location));
      }
      if (res.statusCode !== 200) return reject(new Error('Bad status ' + res.statusCode));
      const bufs = [];
      res.on('data', d => bufs.push(d));
      res.on('end', () => resolve(Buffer.concat(bufs)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function renderSvgBuffer(svgBuf, outPath, width, height) {
  const svgText = svgBuf.toString('utf8');
  const resvg = new Resvg(svgText, { fitTo: { mode: 'width', value: width } });
  const png = resvg.render().asPng();
  const final = await sharp(png).resize(width, height, { fit: 'cover', background: { r:0,g:0,b:0,alpha:0 } }).png().toBuffer();
  fs.writeFileSync(outPath, final);
}

(async ()=>{
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'flags', 'flags.json'), 'utf8'));
  const picks = ['iran', 'the-sahrawi-arab-democratic-republic'];
  const FULL_HEIGHT = 1365;
  for (const id of picks) {
    const entry = manifest.find(e => e.id === id);
    if (!entry) { console.warn('manifest missing', id); continue; }
    const url = entry.media_url || entry.source_page;
    if (!url) { console.warn('no media URL for', id); continue; }
    console.log('Downloading', url);
    try {
      const buf = await fetchToBuffer(url);
      const tmpSvg = path.join(__dirname, id + '.download.svg');
      fs.writeFileSync(tmpSvg, buf);
      console.log('Saved', tmpSvg);
      // compute aspect if viewBox present
      const vb = buf.toString('utf8').match(/viewBox\s*=\s*"([0-9\.\-]+)\s+([0-9\.\-]+)\s+([0-9\.\-]+)\s+([0-9\.\-]+)"/i);
      let aspect = 3/2;
      if (vb) { const w = parseFloat(vb[3]), h = parseFloat(vb[4]); if (w>0 && h>0) aspect = w/h; }
      const width = Math.max(64, Math.round(FULL_HEIGHT * aspect));
      const out = path.join(__dirname, id + '.resvg.test.png');
      console.log('Rendering', id, width + 'x' + FULL_HEIGHT);
      await renderSvgBuffer(buf, out, width, FULL_HEIGHT);
      console.log('Wrote', out);
    } catch (e) {
      console.error('Failed', id, e && e.message);
    }
  }
})();
