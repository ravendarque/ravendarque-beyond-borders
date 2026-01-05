/**
 * Optional dependency loader utility
 * Handles dynamic imports for optional dependencies with proper error handling
 */

/**
 * Load an optional dependency
 * @param {string} moduleName - Name of the module to load
 * @returns {Promise<object|null>} The module or null if not available
 */
export async function loadOptionalDep(moduleName) {
  try {
    const module = await import(moduleName);
    // Handle default exports
    return module.default || module;
  } catch (e) {
    return null;
  }
}

/**
 * Load an optional dependency with a specific export
 * @param {string} moduleName - Name of the module to load
 * @param {string} exportName - Name of the export to get
 * @returns {Promise<object|null>} The export or null if not available
 */
export async function loadOptionalExport(moduleName, exportName) {
  try {
    const module = await import(moduleName);
    return module[exportName] || null;
  } catch (e) {
    return null;
  }
}

/**
 * Require an optional dependency (synchronous check)
 * Note: This is a fallback for cases where we need to check synchronously
 * In ESM, prefer loadOptionalDep for async loading
 * @param {string} moduleName - Name of the module to check
 * @returns {boolean} True if module is available
 */
export function isOptionalDepAvailable(moduleName) {
  try {
    // In ESM, we can't really check synchronously
    // This is mainly for documentation/comments
    return true; // Assume available, actual check happens at import time
  } catch (e) {
    return false;
  }
}
