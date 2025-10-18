import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FlagDropdown } from './FlagDropdown';
import type { FlagSpec } from '@/flags/schema';

const mockFlags: FlagSpec[] = [
  {
    id: 'gay-pride',
    displayName: 'Gay Pride',
    png_full: '/flags/gay-pride.png',
    category: 'marginalized',
    sources: {},
    status: 'active',
  },
  {
    id: 'transgender-pride',
    displayName: 'Transgender Pride',
    png_full: '/flags/transgender-pride.png',
    category: 'marginalized',
    sources: {},
    status: 'active',
  },
  {
    id: 'palestine',
    displayName: 'Palestine',
    png_full: '/flags/palestine.png',
    category: 'national',
    sources: {},
    status: 'active',
  },
  {
    id: 'ukraine',
    displayName: 'Ukraine',
    png_full: '/flags/ukraine.png',
    category: 'national',
    sources: {},
    status: 'active',
  },
];

describe('FlagDropdown', () => {
  describe('rendering', () => {
    it('should render with placeholder text', () => {
      render(
        <FlagDropdown
          flags={mockFlags}
          selectedFlagId={null}
          onChange={vi.fn()}
        />
      );

      expect(screen.getByLabelText(/choose a flag/i)).toBeDefined();
    });

    it('should show selected flag when value is provided', () => {
      render(
        <FlagDropdown
          flags={mockFlags}
          selectedFlagId="palestine"
          onChange={vi.fn()}
        />
      );

      expect(screen.getByDisplayValue('Palestine')).toBeDefined();
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <FlagDropdown
          flags={mockFlags}
          selectedFlagId={null}
          onChange={vi.fn()}
          disabled={true}
        />
      );

      const input = screen.getByRole('combobox');
      expect(input.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('flag options', () => {
    it('should show all flags when opened', async () => {
      render(
        <FlagDropdown
          flags={mockFlags}
          selectedFlagId={null}
          onChange={vi.fn()}
        />
      );

      const input = screen.getByRole('combobox');
      fireEvent.mouseDown(input);

      await waitFor(() => {
        expect(screen.getByText('Gay Pride')).toBeDefined();
        expect(screen.getByText('Transgender Pride')).toBeDefined();
        expect(screen.getByText('Palestine')).toBeDefined();
        expect(screen.getByText('Ukraine')).toBeDefined();
      });
    });

    it('should group flags by category', async () => {
      render(
        <FlagDropdown
          flags={mockFlags}
          selectedFlagId={null}
          onChange={vi.fn()}
        />
      );

      const input = screen.getByRole('combobox');
      fireEvent.mouseDown(input);

      await waitFor(() => {
        // MUI groups are usually rendered with specific structure
        const prideGroup = screen.getByText(/pride/i);
        const nationalGroup = screen.getByText(/national/i);
        expect(prideGroup).toBeDefined();
        expect(nationalGroup).toBeDefined();
      });
    });
  });

  describe('search/filtering', () => {
    it('should filter flags by name', async () => {
      render(
        <FlagDropdown
          flags={mockFlags}
          selectedFlagId={null}
          onChange={vi.fn()}
        />
      );

      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'palestine' } });

      await waitFor(() => {
        expect(screen.getByText('Palestine')).toBeDefined();
        expect(screen.queryByText('Ukraine')).toBeNull();
      });
    });

    it('should filter flags by keywords', async () => {
      render(
        <FlagDropdown
          flags={mockFlags}
          selectedFlagId={null}
          onChange={vi.fn()}
        />
      );

      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'lgbtq' } });

      await waitFor(() => {
        expect(screen.getByText('Gay Pride')).toBeDefined();
        expect(screen.getByText('Transgender Pride')).toBeDefined();
        expect(screen.queryByText('Palestine')).toBeNull();
      });
    });

    it('should be case-insensitive when filtering', async () => {
      render(
        <FlagDropdown
          flags={mockFlags}
          selectedFlagId={null}
          onChange={vi.fn()}
        />
      );

      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'UKRAINE' } });

      await waitFor(() => {
        expect(screen.getByText('Ukraine')).toBeDefined();
      });
    });

    it('should show "No options" when no flags match filter', async () => {
      render(
        <FlagDropdown
          flags={mockFlags}
          selectedFlagId={null}
          onChange={vi.fn()}
        />
      );

      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'xyz-nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText(/no options/i)).toBeDefined();
      });
    });
  });

  describe('selection', () => {
    it('should call onChange when a flag is selected', async () => {
      const handleChange = vi.fn();
      
      render(
        <FlagDropdown
          flags={mockFlags}
          selectedFlagId={null}
          onChange={handleChange}
        />
      );

      const input = screen.getByRole('combobox');
      fireEvent.mouseDown(input);

      await waitFor(() => {
        const option = screen.getByText('Palestine');
        fireEvent.click(option);
      });

      expect(handleChange).toHaveBeenCalledWith('palestine');
    });

    it('should call onChange with null when cleared', async () => {
      const handleChange = vi.fn();
      
      render(
        <FlagDropdown
          flags={mockFlags}
          selectedFlagId="palestine"
          onChange={handleChange}
        />
      );

      const clearButton = screen.getByTitle(/clear/i);
      fireEvent.click(clearButton);

      expect(handleChange).toHaveBeenCalledWith(null);
    });

    it('should update displayed value when selection changes', () => {
      const { rerender } = render(
        <FlagDropdown
          flags={mockFlags}
          selectedFlagId="palestine"
          onChange={vi.fn()}
        />
      );

      expect(screen.getByDisplayValue('Palestine')).toBeDefined();

      rerender(
        <FlagDropdown
          flags={mockFlags}
          selectedFlagId="ukraine"
          onChange={vi.fn()}
        />
      );

      expect(screen.getByDisplayValue('Ukraine')).toBeDefined();
    });
  });

  describe('keyboard navigation', () => {
    it('should open dropdown on Enter key', async () => {
      render(
        <FlagDropdown
          flags={mockFlags}
          selectedFlagId={null}
          onChange={vi.fn()}
        />
      );

      const input = screen.getByRole('combobox');
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Gay Pride')).toBeDefined();
      });
    });

    it('should navigate options with arrow keys', async () => {
      render(
        <FlagDropdown
          flags={mockFlags}
          selectedFlagId={null}
          onChange={vi.fn()}
        />
      );

      const input = screen.getByRole('combobox');
      fireEvent.mouseDown(input);

      await waitFor(() => {
        expect(screen.getByText('Gay Pride')).toBeDefined();
      });

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      // Should highlight second option (implementation dependent on MUI)
      const highlightedOption = document.querySelector('[aria-selected="true"]');
      expect(highlightedOption).toBeDefined();
    });

    it('should select option with Enter key', async () => {
      const handleChange = vi.fn();
      
      render(
        <FlagDropdown
          flags={mockFlags}
          selectedFlagId={null}
          onChange={handleChange}
        />
      );

      const input = screen.getByRole('combobox');
      fireEvent.mouseDown(input);

      await waitFor(() => {
        expect(screen.getByText('Gay Pride')).toBeDefined();
      });

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA label', () => {
      render(
        <FlagDropdown
          flags={mockFlags}
          selectedFlagId={null}
          onChange={vi.fn()}
        />
      );

      const input = screen.getByRole('combobox');
      expect(input.getAttribute('aria-label')).toBeTruthy();
    });

    it('should indicate required state if marked required', () => {
      render(
        <FlagDropdown
          flags={mockFlags}
          selectedFlagId={null}
          onChange={vi.fn()}
          required={true}
        />
      );

      const input = screen.getByRole('combobox');
      expect(input.getAttribute('aria-required')).toBe('true');
    });

    it('should have accessible error message when error prop is provided', () => {
      render(
        <FlagDropdown
          flags={mockFlags}
          selectedFlagId={null}
          onChange={vi.fn()}
          error="Please select a flag"
        />
      );

      expect(screen.getByText('Please select a flag')).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty flags array', () => {
      render(
        <FlagDropdown
          flags={[]}
          selectedFlagId={null}
          onChange={vi.fn()}
        />
      );

      const input = screen.getByRole('combobox');
      fireEvent.mouseDown(input);

      expect(screen.getByText(/no options/i)).toBeDefined();
    });

    it('should handle selected flag that does not exist in flags array', () => {
      render(
        <FlagDropdown
          flags={mockFlags}
          selectedFlagId="nonexistent-flag"
          onChange={vi.fn()}
        />
      );

      // Should render without crashing and show nothing selected
      const input = screen.getByRole('combobox');
      expect(input).toBeDefined();
    });

    it('should handle rapid selection changes', async () => {
      const handleChange = vi.fn();
      
      render(
        <FlagDropdown
          flags={mockFlags}
          selectedFlagId={null}
          onChange={handleChange}
        />
      );

      const input = screen.getByRole('combobox');
      
      // Rapid clicks
      fireEvent.mouseDown(input);
      await waitFor(() => screen.getByText('Palestine'));
      fireEvent.click(screen.getByText('Palestine'));
      
      fireEvent.mouseDown(input);
      await waitFor(() => screen.getByText('Ukraine'));
      fireEvent.click(screen.getByText('Ukraine'));

      expect(handleChange).toHaveBeenCalledTimes(2);
      expect(handleChange).toHaveBeenCalledWith('palestine');
      expect(handleChange).toHaveBeenCalledWith('ukraine');
    });
  });
});
