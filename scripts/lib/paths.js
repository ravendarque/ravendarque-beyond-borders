/**
 * Path resolution utilities for ESM scripts
 * Replaces CommonJS __dirname and __filename patterns
 */

import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

/**
 * Get the directory of the current script file
 * @param {string} importMetaUrl - The import.meta.url from the calling script
 * @returns {string} Directory path
 */
export function getScriptDir(importMetaUrl) {
  return dirname(fileURLToPath(importMetaUrl));
}

/**
 * Get the repository root directory
 * @param {string} importMetaUrl - The import.meta.url from the calling script
 * @returns {string} Repository root path
 */
export function getRepoRoot(importMetaUrl) {
  return join(getScriptDir(importMetaUrl), '..');
}

/**
 * Resolve a path relative to the repository root
 * @param {string} importMetaUrl - The import.meta.url from the calling script
 * @param {...string} pathSegments - Path segments to join
 * @returns {string} Resolved absolute path
 */
export function resolveFromRepo(importMetaUrl, ...pathSegments) {
  return resolve(getRepoRoot(importMetaUrl), ...pathSegments);
}

/**
 * Resolve a path relative to the script directory
 * @param {string} importMetaUrl - The import.meta.url from the calling script
 * @param {...string} pathSegments - Path segments to join
 * @returns {string} Resolved absolute path
 */
export function resolveFromScript(importMetaUrl, ...pathSegments) {
  return resolve(getScriptDir(importMetaUrl), ...pathSegments);
}

/**
 * Get the test results directory path
 * @param {string} importMetaUrl - The import.meta.url from the calling script
 * @returns {string} Test results directory path
 */
export function getTestResultsDir(importMetaUrl) {
  return resolveFromRepo(importMetaUrl, 'test', 'test-results');
}

/**
 * Resolve a path within the test results directory
 * @param {string} importMetaUrl - The import.meta.url from the calling script
 * @param {...string} pathSegments - Path segments to join within test-results
 * @returns {string} Resolved absolute path
 */
export function resolveTestResultsPath(importMetaUrl, ...pathSegments) {
  return resolve(getTestResultsDir(importMetaUrl), ...pathSegments);
}
