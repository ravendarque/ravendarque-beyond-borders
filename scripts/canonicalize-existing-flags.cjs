#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function canonicalizeId(name) {
  if (!name) return '';
  name = name.replace(/\.[a-z0-9]+$/i, '');
  name = name.toLowerCase();
  name = name.replace(/[_\s]+/g, '-');
  name = name.replace(/flags?/g, '');
  name = name.replace(/[^a-z0-9-]/g, '');
  name = name.replace(/-+/g, '-');
  // remove occurrences of 'of-' (leading or internal)
  name = name.replace(/(^|-)of-/g, '$1');
  name = name.replace(/-+/g, '-');
  name = name.replace(/^-+|-+$/g, '');
  if (!name) name = 'unknown';
  return name;
}

const repoRoot = path.resolve(__dirname, '..');
const flagsDir = path.join(repoRoot, 'public', 'flags');
const manifestPath = path.join(flagsDir, 'flags.json');
if (!fs.existsSync(manifestPath)) {
  console.error('No manifest at', manifestPath);
  process.exit(1);
}
let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const summary = { renamed: [], skipped: [], updated: 0 };
for (const entry of manifest) {
  const origId = entry.id || (entry.svgFilename ? entry.svgFilename.replace(/\.svg$/i, '') : null);
  const newId = canonicalizeId(origId || 'flag');
  const oldPng = entry.png_full || (origId ? origId + '.png' : null);
  const oldPreview = entry.png_preview || (origId ? origId + '.preview.png' : null);
  const oldSvg = entry.svgFilename || (origId ? origId + '.svg' : null);
  const newPng = newId + '.png';
  const newPreview = newId + '.preview.png';
  const newSvg = newId + '.svg';

  function tryRename(oldName, newName) {
    if (!oldName) return false;
    const oldPath = path.join(flagsDir, oldName);
    const newPath = path.join(flagsDir, newName);
    if (fs.existsSync(newPath)) {
      summary.skipped.push({ reason: 'target-exists', old: oldName, new: newName });
      return false;
    }
    if (!fs.existsSync(oldPath)) {
      summary.skipped.push({ reason: 'missing-source', old: oldName, new: newName });
      return false;
    }
    try {
      fs.renameSync(oldPath, newPath);
      summary.renamed.push({ old: oldName, new: newName });
      return true;
    } catch (e) {
      summary.skipped.push({ reason: 'error', old: oldName, new: newName, err: String(e) });
      return false;
    }
  }

  // rename pngs and svg if present
  tryRename(oldPng, newPng);
  tryRename(oldPreview, newPreview);
  tryRename(oldSvg, newSvg);

  // update manifest entry
  entry.id = newId;
  entry.png_full = newPng;
  entry.png_preview = newPreview;
  entry.svgFilename = newSvg;
  summary.updated++;
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
console.log('Migration complete:', summary);
console.log('Wrote updated manifest to', manifestPath);
process.exit(0);
