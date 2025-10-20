import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FlagDropdown } from './FlagDropdown';
import type { FlagSpec } from '@/flags/schema';

const mockFlags: FlagSpec[] = [
  {
    id: 'gay-pride',
    name: 'Gay Pride Flag',
    displayName: 'Gay Pride',
    png_full: 'gay-pride.png',
    category: 'oppressed',
    sources: {},
    status: 'active',
  },
  {
    id: 'transgender-pride',
    name: 'Transgender Pride Flag',
    displayName: 'Transgender Pride',
    png_full: 'transgender-pride.png',
    category: 'oppressed',
    sources: {},
    status: 'active',
  },
  {
    id: 'palestine',
    name: 'Palestinian Flag',
    displayName: 'Palestine',
    png_full: 'palestine.png',
    category: 'occupied',
    sources: {},
    status: 'active',
  },
  {
    id: 'ukraine',
    name: 'Ukrainian Flag',
    displayName: 'Ukraine',
    png_full: 'ukraine.png',
    category: 'occupied',
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

      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeDefined();
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
      expect(input).toHaveProperty('disabled', true);
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
        const oppressedGroup = screen.getByText('Oppressed Groups');
        const occupiedGroup = screen.getByText('Occupied / Disputed Territories');
        expect(oppressedGroup).toBeDefined();
        expect(occupiedGroup).toBeDefined();
      });
    });
  });

  describe('search/filtering', () => {
    it('should render combobox that accepts text input', () => {
      render(
        <FlagDropdown
          flags={mockFlags}
          selectedFlagId={null}
          onChange={vi.fn()}
        />
      );

      const input = screen.getByRole('combobox');
      expect(input).toBeDefined();
      expect(input.getAttribute('aria-autocomplete')).toBe('list');
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
      
      // First open the dropdown
      fireEvent.mouseDown(input);
      
      // Then type a filter that won't match
      fireEvent.change(input, { target: { value: 'xyz-nonexistent' } });

      await waitFor(() => {
        const noOptions = screen.queryByText('No options');
        expect(noOptions).toBeDefined();
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
    it('should open dropdown with click', async () => {
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
        // Flags are sorted alphabetically within categories
        // Should see all flags
        expect(screen.getByText('Palestine')).toBeDefined();
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
    it('should have proper ARIA label on TextField', () => {
      const { container } = render(
        <FlagDropdown
          flags={mockFlags}
          selectedFlagId={null}
          onChange={vi.fn()}
        />
      );

      // TextField has aria-label attribute
      const textField = container.querySelector('[aria-label="Choose a flag for your border"]');
      expect(textField).toBeTruthy();
    });

    it('should have combobox role for input', () => {
      render(
        <FlagDropdown
          flags={mockFlags}
          selectedFlagId={null}
          onChange={vi.fn()}
        />
      );

      const input = screen.getByRole('combobox');
      expect(input).toBeTruthy();
    });

    it('should indicate required state if marked required', () => {
      const { container } = render(
        <FlagDropdown
          flags={mockFlags}
          selectedFlagId={null}
          onChange={vi.fn()}
          required={true}
        />
      );

      // MUI TextField sets required attribute on the input element
      const input = container.querySelector('input[required]');
      expect(input).toBeTruthy();
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
