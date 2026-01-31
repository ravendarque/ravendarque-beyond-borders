/**
 * Flag pattern validation utilities
 * Ensures flag data is valid before rendering
 */

import type { FlagSpec } from '@/flags/schema';
import { isValidHexColor } from './canvas-utils';

export class FlagValidationError extends Error {
  constructor(
    message: string,
    public readonly flagId: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = 'FlagValidationError';
  }
}

/**
 * Validate flag modes data before rendering
 * @throws FlagValidationError if validation fails
 */
export function validateFlagPattern(flag: FlagSpec): void {
  // Check ring colors exist
  if (!flag.modes?.ring?.colors || !Array.isArray(flag.modes.ring.colors)) {
    throw new FlagValidationError(
      `Flag "${flag.id}" is missing modes.ring.colors`,
      flag.id,
      'modes.ring.colors',
    );
  }

  // Check minimum color count
  if (flag.modes.ring.colors.length < 1) {
    throw new FlagValidationError(
      `Flag "${flag.id}" must have at least 1 color, got ${flag.modes.ring.colors.length}`,
      flag.id,
      'modes.ring.colors',
    );
  }

  // Check maximum color count (practical limit for rendering)
  if (flag.modes.ring.colors.length > 50) {
    throw new FlagValidationError(
      `Flag "${flag.id}" has too many colors (${flag.modes.ring.colors.length}), maximum is 50`,
      flag.id,
      'modes.ring.colors',
    );
  }

  // Validate each color
  flag.modes.ring.colors.forEach((color, index) => {
    // Check color exists
    if (!color) {
      throw new FlagValidationError(
        `Flag "${flag.id}" color ${index} is missing`,
        flag.id,
        `modes.ring.colors[${index}]`,
      );
    }

    // Check color is valid hex
    if (!isValidHexColor(color)) {
      throw new FlagValidationError(
        `Flag "${flag.id}" color ${index} has invalid hex color: "${color}"`,
        flag.id,
        `modes.ring.colors[${index}]`,
      );
    }
  });
}

/**
 * Validate flag basic metadata
 * @throws FlagValidationError if validation fails
 */
export function validateFlagMetadata(flag: FlagSpec): void {
  // Check ID
  if (!flag.id || typeof flag.id !== 'string') {
    throw new FlagValidationError('Flag is missing valid ID', flag.id || 'unknown', 'id');
  }

  // Check display name
  if (!flag.displayName || typeof flag.displayName !== 'string') {
    throw new FlagValidationError(
      `Flag "${flag.id}" is missing displayName`,
      flag.id,
      'displayName',
    );
  }

  // Check category
  if (!flag.category) {
    throw new FlagValidationError(`Flag "${flag.id}" is missing category`, flag.id, 'category');
  }

  // Category must be a non-empty string; actual values come from flag-data.yaml (no fixed enum)
  if (typeof flag.category !== 'string' || !/^[a-z0-9-]+$/.test(flag.category)) {
    throw new FlagValidationError(
      `Flag "${flag.id}" has invalid category: "${flag.category}" (expected slug-like string)`,
      flag.id,
      'category',
    );
  }
}

/**
 * Comprehensive flag validation (metadata + pattern)
 * @throws FlagValidationError if validation fails
 */
export function validateFlag(flag: FlagSpec): void {
  validateFlagMetadata(flag);
  validateFlagPattern(flag);
}

/**
 * Validate flag and return validation result without throwing
 * @returns Object with valid flag and error if validation failed
 */
export function validateFlagSafe(flag: FlagSpec): {
  isValid: boolean;
  error?: FlagValidationError;
} {
  try {
    validateFlag(flag);
    return { isValid: true };
  } catch (error) {
    if (error instanceof FlagValidationError) {
      return { isValid: false, error };
    }
    // Unexpected error type
    return {
      isValid: false,
      error: new FlagValidationError(`Unexpected validation error: ${error}`, flag.id || 'unknown'),
    };
  }
}

/**
 * Filter valid flags from a list, logging errors for invalid ones
 * @param flags Array of flags to validate
 * @returns Array of valid flags only
 */
export function filterValidFlags(flags: FlagSpec[]): FlagSpec[] {
  return flags.filter((flag) => {
    const result = validateFlagSafe(flag);
    if (!result.isValid) {
      // Invalid flags are silently filtered out
      // Validation errors are handled by the error result object
      return false;
    }
    return true;
  });
}
