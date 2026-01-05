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
export const TEST_IMAGE_PATH = path.resolve(__dirname, '../../test-data/profile-pic.jpg');

/**
 * Get the path to the avatar sample fixture
 */
export const AVATAR_SAMPLE_PATH = path.resolve(process.cwd(), 'tests', 'fixtures', 'avatar-sample.png');

/**
 * Get the path to an invalid test file (for error testing)
 */
export const INVALID_FILE_PATH = path.resolve(__dirname, '../../test-data/invalid.txt');

/**
 * Common flag names for testing
 */
export const TEST_FLAGS = {
  PALESTINE: 'Palestine — Palestinian flag',
  PRIDE: 'Pride — Rainbow Flag',
  UKRAINE: 'Ukraine',
  NON_BINARY: 'Non-binary Pride — Non-binary flag',
  TRANSGENDER: 'Transgender Pride — Transgender flag',
} as const;
