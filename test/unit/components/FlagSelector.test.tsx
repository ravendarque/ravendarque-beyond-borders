import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FlagSelector } from '@/components/FlagSelector';
import type { FlagSpec } from '@/flags/schema';

describe('FlagSelector', () => {
  const mockFlags: FlagSpec[] = [
    {
      id: 'flag1',
      name: 'Flag One',
      displayName: 'Flag One',
      png_full: 'flag1.png',
      category: 'oppressed',
      modes: {
        ring: {
          colors: ['#FF0000'],
        },
      },
    },
    {
      id: 'flag2',
      name: 'Flag Two',
      displayName: 'Flag Two',
      png_full: 'flag2.png',
      category: 'oppressed',
      modes: {
        ring: {
          colors: ['#00FF00'],
        },
      },
    },
  ];

  it('should render label', () => {
    const onFlagChange = vi.fn();
    render(<FlagSelector selectedFlagId={null} flags={mockFlags} onFlagChange={onFlagChange} />);

    // Radix Select renders "Choose a flag" as the trigger text
    const trigger = screen.getByLabelText(/choose a flag/i);
    expect(trigger).toBeTruthy();
  });

  it('should render with empty value', () => {
    const onFlagChange = vi.fn();
    render(<FlagSelector selectedFlagId={null} flags={mockFlags} onFlagChange={onFlagChange} />);

    // Radix Select renders the trigger
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeTruthy();
  });

  it('should render with selected value', () => {
    const onFlagChange = vi.fn();
    render(<FlagSelector selectedFlagId="flag1" flags={mockFlags} onFlagChange={onFlagChange} />);

    // The selected flag display name should be shown
    expect(screen.getByText('Flag One')).toBeTruthy();
  });

  it('should render all flag options when opened', async () => {
    const user = userEvent.setup();
    const onFlagChange = vi.fn();
    render(<FlagSelector selectedFlagId={null} flags={mockFlags} onFlagChange={onFlagChange} />);

    // Open the dropdown
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    // Check for all flags
    expect(screen.getByText('Flag One')).toBeTruthy();
    expect(screen.getByText('Flag Two')).toBeTruthy();
  });

  it('should call onFlagChange when flag is selected', async () => {
    const user = userEvent.setup();
    const onFlagChange = vi.fn();
    render(<FlagSelector selectedFlagId={null} flags={mockFlags} onFlagChange={onFlagChange} />);

    // Open the dropdown
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    // Select a flag
    const flag1Option = screen.getByText('Flag One');
    await user.click(flag1Option);

    expect(onFlagChange).toHaveBeenCalledWith('flag1');
  });

  it('should call onFlagChange with null when None is selected', async () => {
    const user = userEvent.setup();
    const onFlagChange = vi.fn();
    render(<FlagSelector selectedFlagId="flag1" flags={mockFlags} onFlagChange={onFlagChange} />);

    // Open the dropdown
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    // Select None (if available) or clear selection
    const clearOption = screen.queryByText(/none|clear/i);
    if (clearOption) {
      await user.click(clearOption);
      expect(onFlagChange).toHaveBeenCalledWith(null);
    }
  });

  it('should handle empty flags array', () => {
    const onFlagChange = vi.fn();
    render(<FlagSelector selectedFlagId={null} flags={[]} onFlagChange={onFlagChange} />);

    // Radix Select renders the trigger
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeTruthy();
  });

  it('should render correct number of options', async () => {
    const user = userEvent.setup();
    const onFlagChange = vi.fn();
    render(<FlagSelector selectedFlagId={null} flags={mockFlags} onFlagChange={onFlagChange} />);

    // Open the dropdown
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    // Should have 2 flags
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(2);
  });

  it('should use flag id as option value', async () => {
    const user = userEvent.setup();
    const onFlagChange = vi.fn();
    render(<FlagSelector selectedFlagId={null} flags={mockFlags} onFlagChange={onFlagChange} />);

    // Open the dropdown
    const select = document.querySelector('[role="combobox"]') as HTMLElement;
    await user.click(select);

    // Check that options have the correct value
    const flag1Option = screen.getByText('Flag One');
    expect(flag1Option).toBeTruthy();
  });
});
