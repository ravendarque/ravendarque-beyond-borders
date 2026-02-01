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
export const TEST_IMAGE_PATH = path.resolve(__dirname, '../../test-data/profile-pic-square-clr-256x256.jpg');

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
