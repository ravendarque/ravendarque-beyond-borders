import { describe, it, expect, beforeEach, vi } from 'vitest';
import { config, getAssetUrl } from '@/config';

describe('config module', () => {
  describe('getAssetUrl', () => {
    it('should combine base URL with asset path', () => {
      const url = getAssetUrl('flags/flags.json');
      expect(url).toMatch(/flags\/flags\.json$/);
    });

    it('should handle paths with leading slash', () => {
      const url = getAssetUrl('/flags/flags.json');
      expect(url).toMatch(/flags\/flags\.json$/);
    });

    it('should handle paths without leading slash', () => {
      const url = getAssetUrl('flags/flags.json');
      expect(url).toMatch(/flags\/flags\.json$/);
    });

    it('should not create double slashes', () => {
      const url = getAssetUrl('flags/flags.json');
      expect(url).not.toMatch(/\/\//);
    });
  });

  describe('config object', () => {
    it('should provide getAssetUrl method', () => {
      expect(config.getAssetUrl).toBeDefined();
      expect(typeof config.getAssetUrl).toBe('function');
    });

    it('should provide getBaseUrl method', () => {
      expect(config.getBaseUrl).toBeDefined();
      expect(typeof config.getBaseUrl).toBe('function');
    });

    it('should provide isDevelopment method', () => {
      expect(config.isDevelopment).toBeDefined();
      expect(typeof config.isDevelopment).toBe('function');
    });

    it('should provide isProduction method', () => {
      expect(config.isProduction).toBeDefined();
      expect(typeof config.isProduction).toBe('function');
    });

    it('should return consistent base URL', () => {
      const baseUrl1 = config.getBaseUrl();
      const baseUrl2 = config.getBaseUrl();
      expect(baseUrl1).toBe(baseUrl2);
    });

    it('should return boolean for environment checks', () => {
      expect(typeof config.isDevelopment()).toBe('boolean');
      expect(typeof config.isProduction()).toBe('boolean');
    });
  });

  describe('asset URL construction', () => {
    it('should construct correct URLs for flag images', () => {
      const url = config.getAssetUrl('flags/transgender-pride.png');
      expect(url).toContain('flags/transgender-pride.png');
    });

    it('should construct correct URLs for flag JSON', () => {
      const url = config.getAssetUrl('flags/flags.json');
      expect(url).toContain('flags/flags.json');
    });

    it('should handle nested paths', () => {
      const url = config.getAssetUrl('assets/images/logo.png');
      expect(url).toContain('assets/images/logo.png');
    });
  });
});
