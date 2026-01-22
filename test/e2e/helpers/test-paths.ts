/**
 * Centralized test paths and directories
 * Use these constants instead of hardcoding paths throughout test files
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Root directory for test results (screenshots, traces, videos, etc.)
 * This matches the outputDir in playwright.config.ts
 */
export const TEST_RESULTS_DIR = path.resolve(__dirname, '../test-results');

/**
 * Get a path within the test results directory
 */
export function getTestResultsPath(relativePath: string): string {
  return path.resolve(TEST_RESULTS_DIR, relativePath);
}
