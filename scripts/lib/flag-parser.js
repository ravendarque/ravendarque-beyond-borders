/**
 * Flag data parsing utilities
 * Handles parsing YAML flag data and canonicalizing IDs
 */

import { logger } from './logger.js';
import { FlagDataError } from './errors.js';

/**
 * Canonicalize a flag ID from a name or URL
 * @param {string} name - Original name or URL
 * @returns {string} - Canonicalized ID
 */
export function canonicalizeId(name) {
  if (!name) return '';
  name = name.replace(/\.[a-z0-9]+$/i, '');
  name = name.toLowerCase();
  name = name.replace(/[_\s]+/g, '-');
  name = name.replace(/flags?/g, '');
  name = name.replace(/[^a-z0-9-]/g, '');
  name = name.replace(/-+/g, '-');
  name = name.replace(/(^|-)of-/g, '$1');
  name = name.replace(/-+/g, '-');
  name = name.replace(/^-+|-+$/g, '');
  if (!name) name = 'unknown';
  return name;
}

/**
 * Slugify a category display name into a stable key (lowercase, spaces/slashes → hyphens, no special chars).
 * All category codes are derived from YAML categoryName this way; no fixed list.
 * @param {string} name - Category display name
 * @returns {string} - Slug suitable as category key
 */
function slugifyCategoryName(name) {
  if (!name || typeof name !== 'string') return 'other';
  return name
    .toLowerCase()
    .replace(/\s*\/\s*/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'other';
}

/**
 * Map category display name to code. Always slugifies; no fixed category list.
 * @param {string} category - Category display name from YAML
 * @returns {string} - Category code (never null)
 */
export function mapCategoryToCode(category) {
  return slugifyCategoryName(category);
}

/**
 * Parse flags from YAML content
 * @param {string} yaml - YAML content as string
 * @returns {Array} - Array of flattened flag objects
 */
export function parseFlagsFromYaml(yaml) {
  // Dynamic import of js-yaml (CommonJS module)
  // We'll handle this in the caller since we need async
  throw new Error('parseFlagsFromYaml should be called with parsed YAML doc, not raw YAML string');
}

/**
 * Parse flags from parsed YAML document
 * @param {object} doc - Parsed YAML document
 * @returns {Array} - Array of flattened flag objects
 */
export function parseFlagsFromDoc(doc) {
  if (!doc || !Array.isArray(doc.categories)) {
    throw new FlagDataError('YAML structure is invalid. Expected { categories: [{ categoryName: "...", displayOrder: n, flags: [...] }] }');
  }
  
  // Flags are nested under categories - flatten them
  const flattenedFlags = [];
  
  for (const category of doc.categories) {
    if (!category.categoryName || !Array.isArray(category.flags)) {
      throw new FlagDataError(`Invalid category structure. Expected { categoryName: "...", displayOrder: n, flags: [...] }`);
    }
    
    for (const flag of category.flags) {
      flattenedFlags.push({
        ...flag,
        category: mapCategoryToCode(category.categoryName),
        categoryDisplayName: category.categoryName,
        categoryDisplayOrder: category.displayOrder,
        cutoutMode: flag.cutoutMode || null
      });
    }
  }
  
  return flattenedFlags;
}
