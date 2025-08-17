// Minimal test runner for two helper functions
const assert = require('assert');
const helpers = require('../lib/helpers.cjs');

// sanitizeFilename tests
assert.strictEqual(typeof helpers.sanitizeFilename, 'function');
const s = helpers.sanitizeFilename('../File:Weird/Name<>.svg');
console.log('sanitizeFilename ->', s);
assert(!s.includes('/') && !s.includes('..'));

// extractColorsFromSvgText tests
assert.strictEqual(typeof helpers.extractColorsFromSvgText, 'function');
const sample = '#abc rgb(1,2,3) fill: red stop-color: blue';
const cols = helpers.extractColorsFromSvgText(sample);
console.log('extractColorsFromSvgText ->', cols);
assert(Array.isArray(cols) && cols.length >= 2);

console.log('unit-runner finished: all tests passed');
