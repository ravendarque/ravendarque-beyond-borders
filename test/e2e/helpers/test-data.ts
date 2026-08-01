/**
 * Test data paths and fixtures
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get the path to the test profile picture
 */
export const TEST_IMAGE_PATH = path.resolve(
  __dirname,
  '../../test-data/profile-pic-square-clr-256x256.jpg',
);

/**
 * Positioning test image: solid blue background with coloured markers (red center,
 * green/yellow/magenta/cyan corners). Use for E2E zoom/position verification by
 * sampling pixel colours with sharp instead of brittle photo comparison.
 * Generate with: node scripts/generate-positioning-test-image.js
 */
export const POSITIONING_TEST_IMAGE_PATH = path.resolve(
  __dirname,
  '../../test-data/positioning-test-image.png',
);

/**
 * Concentric-ring test pattern, radially symmetric around its center. Use for detecting
 * scale/aspect distortion in the rendered avatar image: sample several points at the same
 * radius from the avatar's center and confirm they match — any non-uniform scaling (e.g. the
 * source image being stretched across the wrong target size instead of cover-scaled into the
 * circle) breaks that symmetry, unlike a photo where "distorted" is only visible by eye.
 */
export const CIRCLE_TEST_PATTERN_PATH = path.resolve(
  __dirname,
  '../../test-data/circle-test-pattern-512x512.png',
);

/**
 * Get the path to the avatar sample fixture
 */
export const AVATAR_SAMPLE_PATH = path.resolve(
  process.cwd(),
  'tests',
  'fixtures',
  'avatar-sample.png',
);

/**
 * Get the path to an invalid test file (for error testing)
 */
export const INVALID_FILE_PATH = path.resolve(__dirname, '../../test-data/invalid.txt');

/**
 * Flag display names for E2E tests.
 * Must match displayName in src/flags/flags.ts (from data/flag-data.yaml).
 */
export const TEST_FLAGS = {
  PALESTINE: 'Palestine',
  PRIDE: 'Pride',
  UKRAINE: 'Ukraine',
  NON_BINARY: 'Non-Binary Pride',
  TRANSGENDER: 'Trans Pride',
} as const;
