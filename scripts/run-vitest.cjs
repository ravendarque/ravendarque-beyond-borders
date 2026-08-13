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

// Resolve vitest's CLI entry via its own declared `bin` field rather than a hardcoded
// subpath - vitest 4 dropped './vitest.mjs' from its package.json `exports` map (the file
// itself still exists, just no longer resolvable via require.resolve('vitest/vitest.mjs')).
const vitestPkgPath = require.resolve('vitest/package.json', { paths: [process.cwd()] });
const vitestPkg = require(vitestPkgPath);
const binRelative = typeof vitestPkg.bin === 'string' ? vitestPkg.bin : vitestPkg.bin.vitest;
const vitestEntry = path.join(path.dirname(vitestPkgPath), binRelative);
const result = spawnSync(process.execPath, [vitestEntry, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env,
  cwd: process.cwd(),
});
process.exit(result.status ?? 1);
