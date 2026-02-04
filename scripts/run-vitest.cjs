#!/usr/bin/env node
/**
 * Run Vitest with a valid --localstorage-file path so Node 25+ doesn't warn.
 * Use: node scripts/run-vitest.cjs [vitest args...]
 */
const path = require('path');
const { spawnSync } = require('child_process');

const cacheDir = path.join(process.cwd(), 'node_modules', '.cache');
const localStoragePath = path.join(cacheDir, 'vitest-localstorage');

const env = { ...process.env };
env.NODE_OPTIONS = [env.NODE_OPTIONS, `--localstorage-file=${localStoragePath}`].filter(Boolean).join(' ');

const vitestEntry = require.resolve('vitest/vitest.mjs', { paths: [process.cwd()] });
const result = spawnSync(process.execPath, [vitestEntry, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env,
  cwd: process.cwd(),
});
process.exit(result.status ?? 1);
