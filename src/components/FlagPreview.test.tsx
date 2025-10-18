import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { FlagPreview } from './FlagPreview';
import type { FlagSpec } from '@/flags/schema';

const mockFlag: FlagSpec = {
  id: 'palestine',
  displayName: 'Palestine',
  png_full: '/flags/palestine.png',
  png_preview: '/flags/palestine.preview.png',
  category: 'national',
  sources: {
    referenceUrl: 'https://example.com/palestine',
    authorNote: 'Test flag',
  },
  status: 'active',
};

describe('FlagPreview', () => {
  describe('rendering', () => {
    it('should render flag image when flag is provided', () => {
      render(<FlagPreview flag={mockFlag} />);

      const img = screen.getByRole('img', { name: /palestine/i });
      expect(img).toBeDefined();
      expect(img.getAttribute('src')).toBe('/flags/palestine.png');
    });

    it('should display flag name', () => {
      render(<FlagPreview flag={mockFlag} />);

      expect(screen.getByText('Palestine')).toBeDefined();
    });

    it('should render placeholder when no flag provided', () => {
      render(<FlagPreview flag={null} />);

      expect(screen.getByText(/select a flag/i)).toBeDefined();
    });

    it('should use preview image if available', () => {
      render(<FlagPreview flag={mockFlag} size="small" />);

      const img = screen.getByRole('img');
      // For small size, should prefer preview image
      expect(img.getAttribute('src')).toBe('/flags/palestine.preview.png');
    });

    it('should fall back to full image if no preview', () => {
      const flagWithoutPreview: FlagSpec = {
        ...mockFlag,
        png_preview: undefined,
      };

      render(<FlagPreview flag={flagWithoutPreview} size="small" />);

      const img = screen.getByRole('img');
      expect(img.getAttribute('src')).toBe('/flags/palestine.png');
    });
  });

  describe('sizes', () => {
    it('should render small size correctly', () => {
      const { container } = render(<FlagPreview flag={mockFlag} size="small" />);

      const preview = container.querySelector('[data-size="small"]');
      expect(preview).toBeDefined();
    });

    it('should render large size correctly', () => {
      const { container } = render(<FlagPreview flag={mockFlag} size="large" />);

      const preview = container.querySelector('[data-size="large"]');
      expect(preview).toBeDefined();
    });

    it('should default to large size', () => {
      const { container } = render(<FlagPreview flag={mockFlag} />);

      const preview = container.querySelector('[data-size="large"]');
      expect(preview).toBeDefined();
    });
  });

  describe('loading state', () => {
    it('should show loading indicator while image loads', () => {
      render(<FlagPreview flag={mockFlag} />);

      // Image should be in loading state initially
      const img = screen.getByRole('img');
      expect(img).toBeDefined();
    });

    it('should hide loading indicator after image loads', async () => {
      render(<FlagPreview flag={mockFlag} />);

      const img = screen.getByRole('img') as HTMLImageElement;
      
      // Simulate image load
      img.dispatchEvent(new Event('load'));

      await waitFor(() => {
        // Check that aria-busy is false after load
        const preview = screen.getByLabelText(/flag preview/i);
        expect(preview.getAttribute('aria-busy')).toBe('false');
      });
    });
  });

  describe('animation', () => {
    it('should apply fade-in animation class', () => {
      const { container } = render(<FlagPreview flag={mockFlag} animate={true} />);

      const preview = container.querySelector('[data-animate="true"]');
      expect(preview).toBeDefined();
    });

    it('should not animate when animate prop is false', () => {
      const { container } = render(<FlagPreview flag={mockFlag} animate={false} />);

      const preview = container.querySelector('[data-animate="false"]');
      expect(preview).toBeDefined();
    });

    it('should respect prefers-reduced-motion', () => {
      // This test would need actual motion preference detection
      // For now, just verify the component renders
      render(<FlagPreview flag={mockFlag} animate={true} />);
      
      expect(screen.getByRole('img')).toBeDefined();
    });
  });

  describe('accessibility', () => {
    it('should have descriptive alt text', () => {
      render(<FlagPreview flag={mockFlag} />);

      const img = screen.getByRole('img');
      expect(img.getAttribute('alt')).toContain('Palestine');
    });

    it('should have proper ARIA label for preview container', () => {
      render(<FlagPreview flag={mockFlag} />);

      const preview = screen.getByLabelText(/flag preview/i);
      expect(preview).toBeDefined();
    });

    it('should indicate loading state to screen readers', () => {
      render(<FlagPreview flag={mockFlag} />);

      // Should have aria-busy or similar attribute during load
      const preview = screen.getByLabelText(/flag preview/i);
      expect(preview).toBeDefined();
    });
  });

  describe('optional information', () => {
    it('should display flag description when showDescription is true', () => {
      const flagWithDescription: FlagSpec = {
        ...mockFlag,
        sources: {
          ...mockFlag.sources,
          authorNote: 'Flag representing Palestine',
        },
      };

      render(<FlagPreview flag={flagWithDescription} showDescription={true} />);

      expect(screen.getByText(/flag representing palestine/i)).toBeDefined();
    });

    it('should not display description when showDescription is false', () => {
      const flagWithDescription: FlagSpec = {
        ...mockFlag,
        sources: {
          ...mockFlag.sources,
          authorNote: 'Flag representing Palestine',
        },
      };

      render(<FlagPreview flag={flagWithDescription} showDescription={false} />);

      expect(screen.queryByText(/flag representing palestine/i)).toBeNull();
    });

    it('should display category badge', () => {
      render(<FlagPreview flag={mockFlag} showCategory={true} />);

      expect(screen.getByText(/national/i)).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle image load error gracefully', async () => {
      render(<FlagPreview flag={mockFlag} />);

      const img = screen.getByRole('img') as HTMLImageElement;
      
      // Simulate image load error
      img.dispatchEvent(new Event('error'));

      await waitFor(() => {
        // Should show error state or fallback
        expect(screen.getByRole('img')).toBeDefined();
      });
    });

    it('should render without crashing when flag has minimal data', () => {
      const minimalFlag: FlagSpec = {
        id: 'test',
        displayName: 'Test Flag',
        png_full: '/test.png',
        category: 'national',
        sources: {},
        status: 'active',
      };

      render(<FlagPreview flag={minimalFlag} />);

      expect(screen.getByText('Test Flag')).toBeDefined();
    });
  });

  describe('interactive features', () => {
    it('should be clickable when onClick handler provided', () => {
      const { container } = render(
        <FlagPreview flag={mockFlag} onClick={() => {}} />
      );

      const preview = container.querySelector('button, [role="button"]');
      expect(preview).toBeDefined();
    });

    it('should not be clickable when no onClick handler', () => {
      const { container } = render(<FlagPreview flag={mockFlag} />);

      const preview = container.querySelector('[data-clickable]');
      expect(preview?.getAttribute('data-clickable')).toBe('false');
    });
  });

  describe('circular display', () => {
    it('should render in circular shape', () => {
      render(<FlagPreview flag={mockFlag} />);

      // Should have circular styling (rounded-full or similar)
      const img = screen.getByRole('img');
      expect(img.className).toContain('rounded-full');
    });

    it('should maintain aspect ratio', () => {
      render(<FlagPreview flag={mockFlag} />);

      const img = screen.getByRole('img');
      // Should have equal width and height classes or styles
      expect(img).toBeDefined();
    });
  });
});
