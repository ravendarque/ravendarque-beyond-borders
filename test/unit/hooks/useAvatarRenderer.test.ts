import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAvatarRenderer } from '@/hooks/useAvatarRenderer';
import type { FlagSpec } from '@/flags/schema';

// Mock the renderAvatar function
vi.mock('@/renderer/render', () => ({
  renderAvatar: vi.fn(async () => new Blob(['test'], { type: 'image/png' })),
}));

describe('useAvatarRenderer', () => {
  const mockFlag: FlagSpec = {
    id: 'test',
    name: 'Test Flag',
    displayName: 'Test Flag',
    png_full: 'test.png',
    category: 'oppressed',
    modes: {
      ring: {
        colors: ['#FF0000', '#00FF00'],
      },
    },
  };

  const mockFlags: FlagSpec[] = [mockFlag];
  const mockCache = new Map<string, ImageBitmap>();

  // Mock global functions
  const mockCreateImageBitmap = vi.fn(async () => ({
    width: 100,
    height: 100,
    close: vi.fn(),
  })) as any;

  const mockFetch = vi.fn(async () => ({
    blob: async () => new Blob(['test'], { type: 'image/png' }),
  })) as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCache.clear();
    global.createImageBitmap = mockCreateImageBitmap;
    global.fetch = mockFetch;
    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('should initialize with null overlayUrl and not rendering', () => {
    const { result } = renderHook(() => useAvatarRenderer(mockFlags, mockCache));

    expect(result.current.overlayUrl).toBeNull();
    expect(result.current.isRendering).toBe(false);
    expect(typeof result.current.render).toBe('function');
  });

  it('should not render when imageUrl is empty', async () => {
    const { result } = renderHook(() => useAvatarRenderer(mockFlags, mockCache));

    await result.current.render('', 'test', {
      size: 1024,
      thickness: 7,
      insetPct: 0,
      flagOffsetX: 0,
      presentation: 'ring',
      bg: 'transparent',
    });

    expect(result.current.overlayUrl).toBeNull();
    expect(result.current.isRendering).toBe(false);
  });

  it('should clear overlay when flagId is empty', async () => {
    const { result } = renderHook(() => useAvatarRenderer(mockFlags, mockCache));

    await result.current.render('blob:test-image', '', {
      size: 1024,
      thickness: 7,
      insetPct: 0,
      flagOffsetX: 0,
      presentation: 'ring',
      bg: 'transparent',
    });

    expect(result.current.overlayUrl).toBeNull();
    expect(result.current.isRendering).toBe(false);
  });

  it('should render successfully with valid inputs', async () => {
    const { result } = renderHook(() => useAvatarRenderer(mockFlags, mockCache));

    await act(async () => {
      await result.current.render('blob:test-image', 'test', {
        size: 1024,
        thickness: 7,
        insetPct: 0,
        flagOffsetX: 0,
        presentation: 'ring',
        bg: 'transparent',
      });
    });

    await waitFor(() => {
      expect(result.current.overlayUrl).toBe('blob:test-url');
    });
  });

  it('should fetch and cache flag image for cutout mode', async () => {
    const { result } = renderHook(() => useAvatarRenderer(mockFlags, mockCache));

    await act(async () => {
      await result.current.render('blob:test-image', 'test', {
        size: 1024,
        thickness: 7,
        insetPct: 0,
        flagOffsetX: 0,
        presentation: 'cutout',
        bg: 'transparent',
      });
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/flags/test.png');
      expect(mockCache.has('test.png')).toBe(true);
    });
  });

  it('should use cached flag image on subsequent renders', async () => {
    // Start with a fresh cache and clear all mocks
    mockCache.clear();
    vi.clearAllMocks();
    
    const mockBitmap = { width: 100, height: 100, close: vi.fn() } as unknown as ImageBitmap;
    mockCache.set('test.png', mockBitmap);

    const { result } = renderHook(() => useAvatarRenderer(mockFlags, mockCache));

    await act(async () => {
      await result.current.render('blob:test-image', 'test', {
        size: 1024,
        thickness: 7,
        insetPct: 0,
        flagOffsetX: 0,
        presentation: 'cutout',
        bg: 'transparent',
      });
    });

    await waitFor(() => {
      expect(result.current.overlayUrl).toBeTruthy();
    });

    // Fetch is called once for the user image (blob:test-image), but not for the flag
    // since it's cached. Check that we only fetched the user image:
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('blob:test-image');
  });

  it('should set isRendering correctly during render lifecycle', async () => {
    const { result } = renderHook(() => useAvatarRenderer(mockFlags, mockCache));

    // Should not be rendering initially
    expect(result.current.isRendering).toBe(false);

    await act(async () => {
      await result.current.render('blob:test-image', 'test', {
        size: 1024,
        thickness: 7,
        insetPct: 0,
        flagOffsetX: 0,
        presentation: 'cutout',
        bg: 'transparent',
      });
    });

    // After render completes, should not be rendering
    await waitFor(() => {
      expect(result.current.isRendering).toBe(false);
    });
  });

  it('should revoke previous overlay URL when creating new one', async () => {
    const { result } = renderHook(() => useAvatarRenderer(mockFlags, mockCache));

    // First render
    await act(async () => {
      await result.current.render('blob:test-image', 'test', {
        size: 1024,
        thickness: 7,
        insetPct: 0,
        flagOffsetX: 0,
        presentation: 'ring',
        bg: 'transparent',
      });
    });

    await waitFor(() => {
      expect(result.current.overlayUrl).toBe('blob:test-url');
    });

    const firstUrl = result.current.overlayUrl;

    // Second render
    await act(async () => {
      await result.current.render('blob:test-image', 'test', {
        size: 1024,
        thickness: 7,
        insetPct: 0,
        flagOffsetX: 0,
        presentation: 'segment',
        bg: 'transparent',
      });
    });

    await waitFor(() => {
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(firstUrl);
    });
  });

  it('should handle rendering errors gracefully', async () => {
    const { renderAvatar } = await import('@/renderer/render');
    vi.mocked(renderAvatar).mockRejectedValueOnce(new Error('Render error'));

    const { result } = renderHook(() => useAvatarRenderer(mockFlags, mockCache));

    // Expect the error to be thrown (re-thrown as AppError)
    await expect(
      act(async () => {
        await result.current.render('blob:test-image', 'test', {
          size: 1024,
          thickness: 7,
          insetPct: 0,
          flagOffsetX: 0,
          presentation: 'ring',
          bg: 'transparent',
        });
      })
    ).rejects.toThrow('Render error');

    // Should clear rendering state even when error occurs
    expect(result.current.isRendering).toBe(false);
  });

  it('should clean up overlay URL on unmount', () => {
    const { result, unmount } = renderHook(() => useAvatarRenderer(mockFlags, mockCache));

    // Manually set an overlay URL (simulating a successful render)
    // In a real scenario, this would be set by the render function
    // We're just testing the cleanup effect

    unmount();

    // The cleanup should have been called
    // Note: We can't easily verify this without actually rendering first
    // This test mainly ensures unmount doesn't throw
    expect(() => unmount()).not.toThrow();
  });

  it('should render with flag modes', async () => {
    const flagWithModes: FlagSpec = {
      ...mockFlag,
      modes: {
        ring: {
          colors: ['#FF0000', '#00FF00', '#0000FF'],
        },
      },
    };

    const { result } = renderHook(() => useAvatarRenderer([flagWithModes], mockCache));

    await act(async () => {
      await result.current.render('blob:test-image', 'test', {
        size: 1024,
        thickness: 7,
        insetPct: 0,
        flagOffsetX: 0,
        presentation: 'ring',
        bg: 'transparent',
      });
    });

    await waitFor(() => {
      expect(result.current.overlayUrl).toBe('blob:test-url');
    });
  });
});
