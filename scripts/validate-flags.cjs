#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function err(msg) {
  console.error(msg);
}

const repoRoot = path.resolve(__dirname, '..');
const flagsTs = path.join(repoRoot, 'src', 'flags', 'flags.ts');
const publicFlagsDir = path.join(repoRoot, 'public', 'flags');

if (!fs.existsSync(flagsTs)) {
  err('Could not find src/flags/flags.ts — aborting validation');
  process.exit(1);
}

const text = fs.readFileSync(flagsTs, 'utf8');
const re = /svgFilename\s*:\s*['\"]([^'\"]+)['\"]/g;
const found = new Set();
let m;
while ((m = re.exec(text)) !== null) {
  if (m[1]) found.add(m[1]);
}

if (!found.size) {
  console.log('No svgFilename entries found in src/flags/flags.ts — nothing to validate.');
  process.exit(0);
}

const missing = [];
for (const name of Array.from(found)) {
  const p = path.join(publicFlagsDir, name);
  if (!fs.existsSync(p)) missing.push(name);
}

if (missing.length) {
  err('Flag SVG validation failed — the following svg files are missing from public/flags:');
  for (const n of missing) err('  - ' + n);
  err('\nEnsure the fetch script or manual step places these files in public/flags before building.');
  process.exit(2);
}

console.log('Flag SVG validation passed — all svgFilename entries have corresponding files in public/flags.');
process.exit(0);
