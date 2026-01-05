/**
 * Custom error classes for scripts
 * Provides structured error handling with context
 */

/**
 * Base error class for script errors
 */
export class ScriptError extends Error {
  constructor(message, code = 'SCRIPT_ERROR', cause = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.cause = cause;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error for flag data issues
 */
export class FlagDataError extends ScriptError {
  constructor(message, cause = null) {
    super(message, 'FLAG_DATA_ERROR', cause);
  }
}

/**
 * Error for validation failures
 */
export class ValidationError extends ScriptError {
  constructor(message, details = null, cause = null) {
    super(message, 'VALIDATION_ERROR', cause);
    this.details = details;
  }
}

/**
 * Error for file operations
 */
export class FileError extends ScriptError {
  constructor(message, filePath = null, cause = null) {
    super(message, 'FILE_ERROR', cause);
    this.filePath = filePath;
  }
}

/**
 * Error for network operations
 */
export class NetworkError extends ScriptError {
  constructor(message, url = null, cause = null) {
    super(message, 'NETWORK_ERROR', cause);
    this.url = url;
  }
}

/**
 * Exit with error code
 * @param {ScriptError|Error|string} error - Error to handle
 * @param {number} exitCode - Exit code (default: 1)
 */
export function exitWithError(error, exitCode = 1) {
  if (error instanceof ScriptError) {
    console.error(`[${error.code}] ${error.message}`);
    if (error.details) {
      console.error('Details:', error.details);
    }
    if (error.cause) {
      console.error('Caused by:', error.cause);
    }
  } else if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
    if (error.stack && process.env.DEBUG) {
      console.error(error.stack);
    }
  } else {
    console.error(String(error));
  }
  process.exit(exitCode);
}
