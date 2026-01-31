#!/usr/bin/env node
/**
 * Generate multi-size favicons from the highest-res source (data/logo.png).
 * Fixes poor quality when used as shortcut icon (e.g. Android home screen).
 * Run from repo root: node scripts/generate-favicons.js
 */

import fs from 'fs';
import { resolveFromRepo } from './lib/paths.js';
import { loadOptionalDep } from './lib/deps.js';

const SIZES = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-48x48.png', size: 48 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-192x192.png', size: 192 },
  { name: 'favicon-512x512.png', size: 512 },
];

async function main() {
  const repoRoot = resolveFromRepo(import.meta.url);
  const publicDir = `${repoRoot}/public`;
  const sourcePath = `${repoRoot}/data/logo.png`;

  if (!fs.existsSync(sourcePath)) {
    console.error('Source not found: data/logo.png');
    process.exit(1);
  }

  const sharp = await loadOptionalDep('sharp');
  if (!sharp) {
    console.error('sharp is required. Install with: pnpm add -D sharp');
    process.exit(1);
  }

  const buffer = fs.readFileSync(sourcePath);
  const pipeline = sharp(buffer);

  for (const { name, size } of SIZES) {
    const outPath = `${publicDir}/${name}`;
    await pipeline.clone().resize(size, size).png().toFile(outPath);
    console.log(`Wrote ${name} (${size}x${size})`);
  }

  console.log('Favicons generated. Update index.html with link tags for each size.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
