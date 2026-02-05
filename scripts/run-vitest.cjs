#!/usr/bin/env node
/**
 * Run Vitest. On Node 25+ sets --localstorage-file so Node doesn't warn.
 * Node 20 (e.g. CI) does not allow this flag in NODE_OPTIONS, so we only set it on 25+.
 * Use: node scripts/run-vitest.cjs [vitest args...]
 */
const path = require('path');
const { spawnSync } = require('child_process');

const env = { ...process.env };
const major = parseInt(process.versions.node.split('.')[0], 10);
if (major >= 25) {
  const cacheDir = path.join(process.cwd(), 'node_modules', '.cache');
  const localStoragePath = path.join(cacheDir, 'vitest-localstorage');
  env.NODE_OPTIONS = [env.NODE_OPTIONS, `--localstorage-file=${localStoragePath}`]
    .filter(Boolean)
    .join(' ');
}

const vitestEntry = require.resolve('vitest/vitest.mjs', { paths: [process.cwd()] });
const result = spawnSync(process.execPath, [vitestEntry, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env,
  cwd: process.cwd(),
});
process.exit(result.status ?? 1);
