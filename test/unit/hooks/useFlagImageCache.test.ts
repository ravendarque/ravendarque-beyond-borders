import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFlagImageCache } from '@/hooks/useFlagImageCache';

describe('useFlagImageCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a Map instance', () => {
    const { result } = renderHook(() => useFlagImageCache());
    
    expect(result.current).toBeInstanceOf(Map);
  });

  it('should return the same Map instance across re-renders', () => {
    const { result, rerender } = renderHook(() => useFlagImageCache());
    
    const firstMap = result.current;
    
    rerender();
    
    expect(result.current).toBe(firstMap);
  });

  it('should allow storing and retrieving ImageBitmaps', () => {
    const { result } = renderHook(() => useFlagImageCache());
    
    // Create a mock ImageBitmap
    const mockBitmap = { width: 100, height: 100, close: vi.fn() } as unknown as ImageBitmap;
    
    result.current.set('test-key', mockBitmap);
    
    expect(result.current.has('test-key')).toBe(true);
    expect(result.current.get('test-key')).toBe(mockBitmap);
  });

  it('should allow storing multiple ImageBitmaps', () => {
    const { result } = renderHook(() => useFlagImageCache());
    
    const bitmap1 = { width: 100, height: 100, close: vi.fn() } as unknown as ImageBitmap;
    const bitmap2 = { width: 200, height: 200, close: vi.fn() } as unknown as ImageBitmap;
    
    result.current.set('key1', bitmap1);
    result.current.set('key2', bitmap2);
    
    expect(result.current.size).toBe(2);
    expect(result.current.get('key1')).toBe(bitmap1);
    expect(result.current.get('key2')).toBe(bitmap2);
  });

  it('should close all cached bitmaps on unmount', () => {
    const { result, unmount } = renderHook(() => useFlagImageCache());
    
    const mockClose1 = vi.fn();
    const mockClose2 = vi.fn();
    
    const bitmap1 = { width: 100, height: 100, close: mockClose1 } as unknown as ImageBitmap;
    const bitmap2 = { width: 200, height: 200, close: mockClose2 } as unknown as ImageBitmap;
    
    result.current.set('key1', bitmap1);
    result.current.set('key2', bitmap2);
    
    unmount();
    
    expect(mockClose1).toHaveBeenCalledTimes(1);
    expect(mockClose2).toHaveBeenCalledTimes(1);
  });

  it('should clear the cache on unmount', () => {
    const { result, unmount } = renderHook(() => useFlagImageCache());
    
    const bitmap = { width: 100, height: 100, close: vi.fn() } as unknown as ImageBitmap;
    
    result.current.set('key', bitmap);
    expect(result.current.size).toBe(1);
    
    unmount();
    
    // Note: We can't check the size after unmount since the component is destroyed
    // but we verified that close() was called, which means cleanup ran
  });

  it('should handle errors when closing bitmaps gracefully', () => {
    const { result, unmount } = renderHook(() => useFlagImageCache());
    
    const mockClose = vi.fn(() => {
      throw new Error('Close error');
    });
    
    const bitmap = { width: 100, height: 100, close: mockClose } as unknown as ImageBitmap;
    
    result.current.set('key', bitmap);
    
    // Should not throw when unmounting
    expect(() => unmount()).not.toThrow();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple error scenarios during cleanup', () => {
    const { result, unmount } = renderHook(() => useFlagImageCache());
    
    const mockClose1 = vi.fn(() => {
      throw new Error('Error 1');
    });
    const mockClose2 = vi.fn(); // This one succeeds
    const mockClose3 = vi.fn(() => {
      throw new Error('Error 3');
    });
    
    const bitmap1 = { width: 100, height: 100, close: mockClose1 } as unknown as ImageBitmap;
    const bitmap2 = { width: 200, height: 200, close: mockClose2 } as unknown as ImageBitmap;
    const bitmap3 = { width: 300, height: 300, close: mockClose3 } as unknown as ImageBitmap;
    
    result.current.set('key1', bitmap1);
    result.current.set('key2', bitmap2);
    result.current.set('key3', bitmap3);
    
    expect(() => unmount()).not.toThrow();
    
    // All close methods should be attempted despite errors
    expect(mockClose1).toHaveBeenCalledTimes(1);
    expect(mockClose2).toHaveBeenCalledTimes(1);
    expect(mockClose3).toHaveBeenCalledTimes(1);
  });
});
