/**
 * Global type declarations for the Beyond Borders application
 */

/**
 * E2E test hooks attached to the window object
 */
interface Window {
  /** Flag set by the application when upload processing is complete */
  __BB_UPLOAD_DONE__?: boolean;
  /** Debug log array for development/testing */
  __BB_DEBUG__?: unknown[];
  /** E2E/debug: last render pipeline stage (where we got to) */
  __BB_RENDER_STAGE__?: string;
  /** E2E/debug: error message if render failed */
  __BB_RENDER_ERROR__?: string;
}

/**
 * Extend the ImportMeta interface to include environment variables
 */
interface ImportMetaEnv {
  readonly NODE_ENV: 'development' | 'production' | 'test';
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
