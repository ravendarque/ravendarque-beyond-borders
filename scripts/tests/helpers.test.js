import { test, expect } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const helpers = require('../lib/helpers.cjs');

test('sanitizeFilename strips paths and normalizes', () => {
  const s = helpers.sanitizeFilename('../File:Weird/Name<>.svg');
  expect(s).not.toContain('/');
  expect(s).not.toContain('..');
  expect(s.toLowerCase().endsWith('.svg')).toBe(true);
});

test('extractColorsFromSvgText normalizes colors', () => {
  const cols = helpers.extractColorsFromSvgText('#abc rgb(1,2,3) fill: red stop-color: blue');
  expect(cols).toContain('#aabbcc');
  expect(cols).toContain('#010203');
  expect(cols).toContain('red');
  expect(cols).toContain('blue');
});
