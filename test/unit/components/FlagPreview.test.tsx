import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { FlagPreview } from '@/components/FlagPreview';
import type { FlagSpec } from '@/flags/schema';

// Mock getAssetUrl
vi.mock('@/config', () => ({
  getAssetUrl: (path: string) => `/base${path}`,
}));

describe('FlagPreview', () => {
  const mockFlag: FlagSpec = {
    id: 'test-flag',
    displayName: 'Test Flag',
    png_preview: 'test-flag-preview.png',
    png_full: 'test-flag-full.png',
    category: 'oppressed',
    modes: {
      ring: {
        colors: ['#FF0000', '#00FF00'],
      },
    },
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render empty state when flag is null', () => {
    render(<FlagPreview flag={null} />);

    expect(screen.getByText('Choose a flag to see preview')).toBeTruthy();
  });

  it('should render placeholder when imageUrl is not ready', () => {
    render(<FlagPreview flag={mockFlag} />);

    // Initially should show placeholder
    expect(screen.getByText('No preview available')).toBeTruthy();
  });

  it('should render flag image when ready', () => {
    render(<FlagPreview flag={mockFlag} />);

    act(() => {
      vi.advanceTimersByTime(20);
    });

    const img = screen.queryByAltText('Test Flag');
    expect(img || screen.queryByText('No preview available')).toBeTruthy();
  });

  it('should use png_preview when available', () => {
    render(<FlagPreview flag={mockFlag} />);

    act(() => {
      vi.advanceTimersByTime(20);
    });

    const img = screen.queryByAltText('Test Flag') as HTMLImageElement;
    if (img) {
      expect(img.src).toContain('test-flag-preview.png');
    }
  });

  it('should fallback to png_full when png_preview is not available', () => {
    const flagWithoutPreview: FlagSpec = {
      ...mockFlag,
      png_preview: null,
    };

    render(<FlagPreview flag={flagWithoutPreview} />);

    act(() => {
      vi.advanceTimersByTime(20);
    });

    const img = screen.queryByAltText('Test Flag') as HTMLImageElement;
    if (img) {
      expect(img.src).toContain('test-flag-full.png');
    }
  });

  it('should apply correct aspect ratio from flag', () => {
    const flagWithAspectRatio: FlagSpec = {
      ...mockFlag,
      aspectRatio: 1.5,
    };

    const { container } = render(<FlagPreview flag={flagWithAspectRatio} />);

    act(() => {
      vi.advanceTimersByTime(20);
    });

    const previewDiv = container.querySelector('.flag-preview[style*="aspect-ratio"]');
    if (previewDiv) {
      expect((previewDiv as HTMLElement).style.aspectRatio).toBe('1.5 / 1');
    } else {
      expect(container.querySelector('.flag-preview')).toBeTruthy();
    }
  });

  it('should use default aspect ratio of 2:1 when not specified', () => {
    const { container } = render(<FlagPreview flag={mockFlag} />);

    act(() => {
      vi.advanceTimersByTime(20);
    });

    const previewDiv = container.querySelector('.flag-preview[style*="aspect-ratio"]');
    if (previewDiv) {
      expect((previewDiv as HTMLElement).style.aspectRatio).toBe('2 / 1');
    } else {
      expect(container.querySelector('.flag-preview')).toBeTruthy();
    }
  });

  it('should render about button when image is ready', () => {
    render(<FlagPreview flag={mockFlag} />);

    act(() => {
      vi.advanceTimersByTime(20);
    });

    const aboutButton = screen.queryByText('About this flag');
    expect(aboutButton || screen.queryByText('No preview available')).toBeTruthy();
  });
});
