/**
 * Application configuration
 * Centralizes environment-specific configuration and provides a clean API
 * for accessing config values throughout the application.
 */

/**
 * Configuration interface
 */
interface AppConfig {
  /**
   * Get the full URL for an asset path
   * @param path - Relative path to the asset (e.g., 'flags/palestine.png')
   * @returns Full URL including base path
   */
  getAssetUrl: (path: string) => string;

  /**
   * Get the base URL for the application
   * @returns Base URL (e.g., '/' or '/ravendarque-beyond-borders/')
   */
  getBaseUrl: () => string;

  /**
   * Get the application version
   * @returns Version string (e.g., '1.0.0' or '1.1.0-alpha.3')
   */
  getVersion: () => string;

  /**
   * Check if running in development mode
   */
  isDevelopment: () => boolean;

  /**
   * Check if running in production mode
   */
  isProduction: () => boolean;
}

/**
 * Create application configuration
 * This encapsulates all environment variable access
 */
function createConfig(): AppConfig {
  // Cache base URL to avoid repeated env var access
  const baseUrl = import.meta.env.BASE_URL || '/';
  const mode = import.meta.env.MODE || 'production';
  // Version is injected at build time via vite.config.ts define
  const version = (import.meta.env.APP_VERSION as string) || '0.0.0';

  return {
    getAssetUrl(path: string): string {
      // Remove leading slash from path if present
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;

      // Combine base URL with path
      // Handle trailing slash in base URL
      const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

      return `${base}${cleanPath}`;
    },

    getBaseUrl(): string {
      return baseUrl;
    },

    getVersion(): string {
      return version;
    },

    isDevelopment(): boolean {
      return mode === 'development';
    },

    isProduction(): boolean {
      return mode === 'production';
    },
  };
}

/**
 * Global configuration instance
 * This is the single source of truth for application configuration
 */
export const config = createConfig();

/**
 * Convenience function for getting asset URLs
 * @param path - Relative path to the asset
 * @returns Full URL including base path
 *
 * @example
 * ```ts
 * const flagUrl = getAssetUrl('flags/palestine.png');
 * // Development: '/flags/palestine.png'
 * // Production: '/ravendarque-beyond-borders/flags/palestine.png'
 * ```
 */
export function getAssetUrl(path: string): string {
  return config.getAssetUrl(path);
}
