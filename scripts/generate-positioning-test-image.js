#!/usr/bin/env node
/**
 * Generate a test image for E2E positioning/zoom verification.
 * Solid background with distinct coloured markers so the downloaded result
 * can be verified by sampling pixel colours instead of brittle photo comparison.
 *
 * Layout (256x256):
 *   - Background: solid blue #4080c0
 *   - Center: 24x24 red #c04040 at (116,116)
 *   - Top-left: 16x16 green #40c040 at (0,0)
 *   - Top-right: 16x16 yellow #c0c040 at (240,0)
 *   - Bottom-left: 16x16 magenta #c040c0 at (0,240)
 *   - Bottom-right: 16x16 cyan #40c0c0 at (240,240)
 *
 * Run from repo root: node scripts/generate-positioning-test-image.js
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import sharp from 'sharp';

const W = 256;
const H = 256;
const CHANNELS = 3;

const COLORS = {
  background: [0x40, 0x80, 0xc0],
  center: [0xc0, 0x40, 0x40],
  topLeft: [0x40, 0xc0, 0x40],
  topRight: [0xc0, 0xc0, 0x40],
  bottomLeft: [0xc0, 0x40, 0xc0],
  bottomRight: [0x40, 0xc0, 0xc0],
};

const MARKERS = [
  { name: 'center', color: COLORS.center, x: 116, y: 116, w: 24, h: 24 },
  { name: 'topLeft', color: COLORS.topLeft, x: 0, y: 0, w: 16, h: 16 },
  { name: 'topRight', color: COLORS.topRight, x: 240, y: 0, w: 16, h: 16 },
  { name: 'bottomLeft', color: COLORS.bottomLeft, x: 0, y: 240, w: 16, h: 16 },
  { name: 'bottomRight', color: COLORS.bottomRight, x: 240, y: 240, w: 16, h: 16 },
];

function fillRect(buffer, x, y, w, h, color) {
  for (let py = y; py < y + h && py < H; py++) {
    for (let px = x; px < x + w && px < W; px++) {
      const idx = (py * W + px) * CHANNELS;
      buffer[idx] = color[0];
      buffer[idx + 1] = color[1];
      buffer[idx + 2] = color[2];
    }
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const outPath = join(repoRoot, 'test', 'test-data', 'positioning-test-image.png');

const buffer = Buffer.alloc(W * H * CHANNELS);
fillRect(buffer, 0, 0, W, H, COLORS.background);
for (const m of MARKERS) {
  fillRect(buffer, m.x, m.y, m.w, m.h, m.color);
}

await sharp(buffer, { raw: { width: W, height: H, channels: CHANNELS } })
  .png()
  .toFile(outPath);

console.log(`Wrote ${outPath}`);
console.log('Markers: center=red, corners=green/yellow/magenta/cyan. Use in E2E to verify zoom/position by sampling pixel colours.');
