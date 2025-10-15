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
    public readonly field?: string
  ) {
    super(message);
    this.name = 'FlagValidationError';
  }
}

/**
 * Validate flag pattern data before rendering
 * @throws FlagValidationError if validation fails
 */
export function validateFlagPattern(flag: FlagSpec): void {
  // Check pattern exists
  if (!flag.pattern) {
    throw new FlagValidationError(
      `Flag "${flag.id}" is missing pattern data`,
      flag.id,
      'pattern'
    );
  }
  
  // Check stripes exist
  if (!flag.pattern.stripes || !Array.isArray(flag.pattern.stripes)) {
    throw new FlagValidationError(
      `Flag "${flag.id}" pattern is missing stripes array`,
      flag.id,
      'pattern.stripes'
    );
  }
  
  // Check minimum stripe count
  if (flag.pattern.stripes.length < 1) {
    throw new FlagValidationError(
      `Flag "${flag.id}" must have at least 1 stripe, got ${flag.pattern.stripes.length}`,
      flag.id,
      'pattern.stripes'
    );
  }
  
  // Check maximum stripe count (practical limit for rendering)
  if (flag.pattern.stripes.length > 50) {
    throw new FlagValidationError(
      `Flag "${flag.id}" has too many stripes (${flag.pattern.stripes.length}), maximum is 50`,
      flag.id,
      'pattern.stripes'
    );
  }
  
  // Validate each stripe
  flag.pattern.stripes.forEach((stripe, index) => {
    // Check color exists
    if (!stripe.color) {
      throw new FlagValidationError(
        `Flag "${flag.id}" stripe ${index} is missing color`,
        flag.id,
        `pattern.stripes[${index}].color`
      );
    }
    
    // Check color is valid hex
    if (!isValidHexColor(stripe.color)) {
      throw new FlagValidationError(
        `Flag "${flag.id}" stripe ${index} has invalid hex color: "${stripe.color}"`,
        flag.id,
        `pattern.stripes[${index}].color`
      );
    }
    
    // Check weight exists
    if (typeof stripe.weight !== 'number') {
      throw new FlagValidationError(
        `Flag "${flag.id}" stripe ${index} is missing weight`,
        flag.id,
        `pattern.stripes[${index}].weight`
      );
    }
    
    // Check weight is positive
    if (stripe.weight <= 0) {
      throw new FlagValidationError(
        `Flag "${flag.id}" stripe ${index} has non-positive weight: ${stripe.weight}`,
        flag.id,
        `pattern.stripes[${index}].weight`
      );
    }
    
    // Check weight is finite
    if (!Number.isFinite(stripe.weight)) {
      throw new FlagValidationError(
        `Flag "${flag.id}" stripe ${index} has non-finite weight: ${stripe.weight}`,
        flag.id,
        `pattern.stripes[${index}].weight`
      );
    }
  });
  
  // Check orientation
  if (!flag.pattern.orientation) {
    throw new FlagValidationError(
      `Flag "${flag.id}" pattern is missing orientation`,
      flag.id,
      'pattern.orientation'
    );
  }
  
  if (flag.pattern.orientation !== 'horizontal' && flag.pattern.orientation !== 'vertical') {
    throw new FlagValidationError(
      `Flag "${flag.id}" pattern has invalid orientation: "${flag.pattern.orientation}"`,
      flag.id,
      'pattern.orientation'
    );
  }
}

/**
 * Validate flag basic metadata
 * @throws FlagValidationError if validation fails
 */
export function validateFlagMetadata(flag: FlagSpec): void {
  // Check ID
  if (!flag.id || typeof flag.id !== 'string') {
    throw new FlagValidationError(
      'Flag is missing valid ID',
      flag.id || 'unknown',
      'id'
    );
  }
  
  // Check display name
  if (!flag.displayName || typeof flag.displayName !== 'string') {
    throw new FlagValidationError(
      `Flag "${flag.id}" is missing displayName`,
      flag.id,
      'displayName'
    );
  }
  
  // Check category
  if (!flag.category) {
    throw new FlagValidationError(
      `Flag "${flag.id}" is missing category`,
      flag.id,
      'category'
    );
  }
  
  const validCategories = ['marginalized', 'national', 'other'];
  if (!validCategories.includes(flag.category)) {
    throw new FlagValidationError(
      `Flag "${flag.id}" has invalid category: "${flag.category}"`,
      flag.id,
      'category'
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
      error: new FlagValidationError(
        `Unexpected validation error: ${error}`,
        flag.id || 'unknown'
      ),
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
      // Log validation errors in development
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('Invalid flag filtered out:', result.error?.message);
      }
      return false;
    }
    return true;
  });
}
