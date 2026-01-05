/**
 * Centralized configuration for scripts
 * Contains paths, constants, and configuration values
 */

import { resolveFromRepo } from './paths.js';

/**
 * Get configuration object with resolved paths
 * @param {string} importMetaUrl - The import.meta.url from the calling script
 * @returns {object} Configuration object
 */
export function getConfig(importMetaUrl) {
  return {
    paths: {
      dataYaml: resolveFromRepo(importMetaUrl, 'data', 'flag-data.yaml'),
      schema: resolveFromRepo(importMetaUrl, 'data', 'flag-data.schema.json'),
      flagsDir: resolveFromRepo(importMetaUrl, 'public', 'flags'),
      flagsTs: resolveFromRepo(importMetaUrl, 'src', 'flags', 'flags.ts'),
      repoRoot: resolveFromRepo(importMetaUrl),
    },
    image: {
      fullHeight: 1365,
      previewWidth: 512,
    },
    validation: {
      minCanvasUsage: 0.8, // Flags must use at least 80% of canvas
    },
  };
}
