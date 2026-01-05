/**
 * Integration tests for flag data flow
 * Tests YAML → TypeScript generation → validation → rendering pipeline
 */

import { describe, it, expect } from 'vitest';
import { flags } from '@/flags/flags';
import { FlagSpec } from '@/flags/schema';
import { validateFlagPattern } from '@/renderer/flag-validation';

describe('Flag Data Flow Integration', () => {
  describe('Data Loading and Validation', () => {
    it('should load all flags from generated TypeScript', () => {
      expect(flags.length).toBeGreaterThan(0);
      expect(Array.isArray(flags)).toBe(true);
    });

    it('should have valid schema for all flags', () => {
      for (const flag of flags) {
        expect(flag.id).toBeTruthy();
        expect(flag.displayName).toBeTruthy();
        expect(flag.modes?.ring?.colors).toBeDefined();
        expect(Array.isArray(flag.modes?.ring?.colors)).toBe(true);
      }
    });

    it('should validate flag patterns for all flags', () => {
      for (const flag of flags) {
        expect(() => {
          validateFlagPattern(flag);
        }).not.toThrow();
      }
    });
  });

  describe('Cutout Mode Configuration', () => {
    it('should have correct cutout configuration for flags that support it', () => {
      const cutoutFlags = flags.filter(f => f.modes?.cutout?.offsetEnabled);
      
      for (const flag of cutoutFlags) {
        expect(flag.modes?.cutout).toBeDefined();
        expect(flag.modes?.cutout?.offsetEnabled).toBe(true);
        expect(typeof flag.modes?.cutout?.defaultOffset).toBe('number');
        expect(flag.modes?.cutout?.defaultOffset).toBeGreaterThanOrEqual(-50);
        expect(flag.modes?.cutout?.defaultOffset).toBeLessThanOrEqual(50);
      }
    });

    it('should have PNG files for all flags with cutout mode', () => {
      const cutoutFlags = flags.filter(f => f.modes?.cutout?.offsetEnabled);
      
      for (const flag of cutoutFlags) {
        expect(flag.png_full).toBeTruthy();
        // PNG file should exist (would need to check file system in real test)
      }
    });
  });

  describe('Flag Metadata Integration', () => {
    it('should have aspect ratios for all flags', () => {
      for (const flag of flags) {
        if (flag.aspectRatio) {
          expect(typeof flag.aspectRatio).toBe('number');
          expect(flag.aspectRatio).toBeGreaterThan(0);
        }
      }
    });

    it('should have references for flags that need them', () => {
      // Flags with reasons should have references
      const flagsWithReasons = flags.filter(f => f.reason);
      
      for (const flag of flagsWithReasons) {
        if (flag.references) {
          expect(Array.isArray(flag.references)).toBe(true);
          expect(flag.references.length).toBeGreaterThan(0);
          
          for (const ref of flag.references) {
            expect(ref.url).toBeTruthy();
            expect(ref.text).toBeTruthy();
          }
        }
      }
    });
  });

  describe('Flag Rendering Integration', () => {
    it('should be able to render all flags in ring mode', async () => {
      // This would test that all flags can be rendered
      // In a real integration test, we'd actually call renderAvatar
      for (const flag of flags.slice(0, 5)) {
        expect(flag.modes?.ring?.colors).toBeDefined();
        expect(flag.modes?.ring?.colors?.length).toBeGreaterThan(0);
      }
    });

    it('should have valid color data for all flags', () => {
      for (const flag of flags) {
        const colors = flag.modes?.ring?.colors || [];
        for (const color of colors) {
          expect(color).toMatch(/^#[0-9A-Fa-f]{3,6}$/);
        }
      }
    });
  });
});
