/**
 * Application Error Types
 *
 * Defines structured error types for different failure scenarios
 * with user-friendly messages and recovery suggestions.
 */

import { FILE_SIZE } from '@/constants';

export enum ErrorCode {
  // Network Errors (1xxx)
  NETWORK_FAILURE = 'NETWORK_FAILURE',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_OFFLINE = 'NETWORK_OFFLINE',

  // File Validation Errors (2xxx)
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_INVALID_TYPE = 'FILE_INVALID_TYPE',
  FILE_LOAD_FAILED = 'FILE_LOAD_FAILED',
  FILE_DIMENSIONS_INVALID = 'FILE_DIMENSIONS_INVALID',

  // Rendering Errors (3xxx)
  RENDER_FAILED = 'RENDER_FAILED',
  CANVAS_NOT_SUPPORTED = 'CANVAS_NOT_SUPPORTED',
  BROWSER_LIMIT_EXCEEDED = 'BROWSER_LIMIT_EXCEEDED',

  // Flag Data Errors (4xxx)
  FLAG_DATA_MISSING = 'FLAG_DATA_MISSING',
  FLAG_DATA_INVALID = 'FLAG_DATA_INVALID',
  FLAG_LOAD_FAILED = 'FLAG_LOAD_FAILED',
  FLAG_PATTERN_MISSING = 'FLAG_PATTERN_MISSING',

  // Generic Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  userMessage: string;
  recoverySuggestion?: string;
  canRetry: boolean;
  originalError?: Error;
}

/**
 * Base application error class with enhanced error details
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly userMessage: string;
  public readonly recoverySuggestion?: string;
  public readonly canRetry: boolean;
  public readonly originalError?: Error;

  constructor(details: ErrorDetails) {
    super(details.message);
    this.name = 'AppError';
    this.code = details.code;
    this.userMessage = details.userMessage;
    this.recoverySuggestion = details.recoverySuggestion;
    this.canRetry = details.canRetry;
    this.originalError = details.originalError;

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Get full error details for logging/debugging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      recoverySuggestion: this.recoverySuggestion,
      canRetry: this.canRetry,
      stack: this.stack,
      originalError: this.originalError?.message,
    };
  }
}

/**
 * Network-related errors (failed fetches, timeouts, offline)
 */
export class NetworkError extends AppError {
  constructor(message: string, originalError?: Error) {
    super({
      code: ErrorCode.NETWORK_FAILURE,
      message,
      userMessage: 'Unable to connect to the server. Please check your internet connection.',
      recoverySuggestion: 'Check your internet connection and try again.',
      canRetry: true,
      originalError,
    });
    this.name = 'NetworkError';
  }
}

/**
 * File validation errors (size, type, format)
 */
export class FileValidationError extends AppError {
  constructor(code: ErrorCode, message: string, userMessage: string, recoverySuggestion: string) {
    super({
      code,
      message,
      userMessage,
      recoverySuggestion,
      canRetry: false,
    });
    this.name = 'FileValidationError';
  }

  static fileTooLarge(size: number, maxSize: number): FileValidationError {
    const sizeMB = (size / FILE_SIZE.BYTES_PER_MB).toFixed(1);
    const maxMB = (maxSize / FILE_SIZE.BYTES_PER_MB).toFixed(0);
    return new FileValidationError(
      ErrorCode.FILE_TOO_LARGE,
      `File size ${sizeMB}MB exceeds maximum ${maxMB}MB`,
      `This file is too large (${sizeMB}MB). Maximum file size is ${maxMB}MB.`,
      `Please choose a smaller image or compress it before uploading.`,
    );
  }

  static invalidFileType(type: string): FileValidationError {
    return new FileValidationError(
      ErrorCode.FILE_INVALID_TYPE,
      `Invalid file type: ${type}`,
      'This file type is not supported. Please use JPG or PNG images.',
      'Choose a JPG or PNG image file and try again.',
    );
  }

  static loadFailed(_originalError?: Error): FileValidationError {
    return new FileValidationError(
      ErrorCode.FILE_LOAD_FAILED,
      'Failed to load image file',
      'Unable to load this image. The file may be corrupted.',
      'Try a different image file or re-save this image and try again.',
    );
  }

  static dimensionsTooLarge(
    width: number,
    height: number,
    maxDimension: number,
  ): FileValidationError {
    return new FileValidationError(
      ErrorCode.FILE_INVALID_TYPE, // Reusing this code for dimension validation
      `Image dimensions ${width}x${height} exceed maximum ${maxDimension}px`,
      `This image is too large (${width}x${height} pixels). Maximum dimension is ${maxDimension}px.`,
      `Please resize the image to ${maxDimension}px or smaller and try again.`,
    );
  }
}

/**
 * Rendering errors (canvas failures, browser limits)
 */
export class RenderError extends AppError {
  constructor(
    message: string,
    userMessage: string,
    recoverySuggestion: string,
    canRetry = true,
    originalError?: Error,
  ) {
    super({
      code: ErrorCode.RENDER_FAILED,
      message,
      userMessage,
      recoverySuggestion,
      canRetry,
      originalError,
    });
    this.name = 'RenderError';
  }

  static canvasNotSupported(): RenderError {
    return new RenderError(
      'Canvas API not supported',
      'Your browser does not support the features needed for this app.',
      'Please try using a modern browser like Chrome, Firefox, or Safari.',
      false,
    );
  }

  static browserLimitExceeded(): RenderError {
    return new RenderError(
      'Browser rendering limit exceeded',
      'This image is too large for your browser to process.',
      'Try using a smaller image (under 4000x4000 pixels).',
      false,
    );
  }

  static renderFailed(originalError?: Error): RenderError {
    return new RenderError(
      'Rendering failed',
      'Unable to create the bordered image. This might be a temporary issue.',
      'Try adjusting the border settings or using a different image.',
      true,
      originalError,
    );
  }
}

/**
 * Flag data errors (missing/invalid flag data)
 */
export class FlagDataError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    userMessage: string,
    recoverySuggestion: string,
    canRetry = false,
  ) {
    super({
      code,
      message,
      userMessage,
      recoverySuggestion,
      canRetry,
    });
    this.name = 'FlagDataError';
  }

  static loadFailed(_originalError?: Error): FlagDataError {
    return new FlagDataError(
      ErrorCode.FLAG_LOAD_FAILED,
      'Failed to load flag definitions',
      'Unable to load the flag library. This might be a network issue.',
      'Check your internet connection and refresh the page.',
      true,
    );
  }

  static patternMissing(flagId: string): FlagDataError {
    return new FlagDataError(
      ErrorCode.FLAG_PATTERN_MISSING,
      `Flag ${flagId} has no pattern definition`,
      'This flag cannot be displayed because its design data is missing.',
      'Please choose a different flag or report this issue.',
      false,
    );
  }

  static dataInvalid(flagId: string): FlagDataError {
    return new FlagDataError(
      ErrorCode.FLAG_DATA_INVALID,
      `Flag ${flagId} has invalid data`,
      'This flag has invalid design data and cannot be used.',
      'Please choose a different flag or report this issue.',
      false,
    );
  }
}

/**
 * Convert unknown errors to AppError instances
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Try to categorize based on error message
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return new NetworkError(error.message, error);
    }

    if (message.includes('canvas')) {
      return RenderError.canvasNotSupported();
    }

    // Generic error
    return new AppError({
      code: ErrorCode.UNKNOWN_ERROR,
      message: error.message,
      userMessage: 'An unexpected error occurred.',
      recoverySuggestion: 'Please try again. If the problem persists, refresh the page.',
      canRetry: true,
      originalError: error,
    });
  }

  // Non-Error objects
  return new AppError({
    code: ErrorCode.UNKNOWN_ERROR,
    message: String(error),
    userMessage: 'An unexpected error occurred.',
    recoverySuggestion: 'Please try again. If the problem persists, refresh the page.',
    canRetry: true,
  });
}
