import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FlagSelector } from '@/components/FlagSelector';
import type { FlagSpec } from '@/flags/schema';

describe('FlagSelector', () => {
  const mockFlags: FlagSpec[] = [
    {
      id: 'flag1',
      displayName: 'Flag One',
      png_full: 'flag1.png',
      category: 'marginalized',
      status: 'active',
      sources: {},
      pattern: {
        type: 'stripes',
        orientation: 'horizontal',
        stripes: [{ color: '#FF0000', weight: 1 }],
      },
    },
    {
      id: 'flag2',
      displayName: 'Flag Two',
      png_full: 'flag2.png',
      category: 'marginalized',
      status: 'active',
      sources: {},
      pattern: {
        type: 'stripes',
        orientation: 'horizontal',
        stripes: [{ color: '#00FF00', weight: 1 }],
      },
    },
  ];

  it('should render label', () => {
    const onChange = vi.fn();
    render(<FlagSelector value="" flags={mockFlags} onChange={onChange} />);
    
    // MUI renders the label text in multiple places (label + fieldset legend)
    const labels = screen.getAllByText('Select a flag');
    expect(labels.length).toBeGreaterThan(0);
  });

  it('should render with empty value', () => {
    const onChange = vi.fn();
    render(<FlagSelector value="" flags={mockFlags} onChange={onChange} />);
    
    // MUI Select renders the selected value
    const select = document.querySelector('[role="combobox"]') as HTMLElement;
    expect(select).toBeTruthy();
  });

  it('should render with selected value', () => {
    const onChange = vi.fn();
    render(<FlagSelector value="flag1" flags={mockFlags} onChange={onChange} />);
    
    // The selected flag display name should be shown
    expect(screen.getByText('Flag One')).toBeTruthy();
  });

  it('should render all flag options when opened', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FlagSelector value="" flags={mockFlags} onChange={onChange} />);
    
    // Open the dropdown
    const select = document.querySelector('[role="combobox"]') as HTMLElement;
    await user.click(select);
    
    // Check for "None" option and all flags
    expect(screen.getByText('None')).toBeTruthy();
    expect(screen.getByText('Flag One')).toBeTruthy();
    expect(screen.getByText('Flag Two')).toBeTruthy();
  });

  it('should call onChange when flag is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FlagSelector value="" flags={mockFlags} onChange={onChange} />);
    
    // Open the dropdown
    const select = document.querySelector('[role="combobox"]') as HTMLElement;
    await user.click(select);
    
    // Select a flag
    const flag1Option = screen.getByText('Flag One');
    await user.click(flag1Option);
    
    expect(onChange).toHaveBeenCalledWith('flag1');
  });

  it('should call onChange with empty string when None is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FlagSelector value="flag1" flags={mockFlags} onChange={onChange} />);
    
    // Open the dropdown
    const select = document.querySelector('[role="combobox"]') as HTMLElement;
    await user.click(select);
    
    // Select None
    const noneOption = screen.getByText('None');
    await user.click(noneOption);
    
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('should handle empty flags array', () => {
    const onChange = vi.fn();
    render(<FlagSelector value="" flags={[]} onChange={onChange} />);
    
    // MUI renders the label text in multiple places
    const labels = screen.getAllByText('Select a flag');
    expect(labels.length).toBeGreaterThan(0);
  });

  it('should render correct number of options', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FlagSelector value="" flags={mockFlags} onChange={onChange} />);
    
    // Open the dropdown
    const select = document.querySelector('[role="combobox"]') as HTMLElement;
    await user.click(select);
    
    // Should have "None" + 2 flags = 3 options
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(3);
  });

  it('should use flag id as option value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FlagSelector value="" flags={mockFlags} onChange={onChange} />);
    
    // Open the dropdown
    const select = document.querySelector('[role="combobox"]') as HTMLElement;
    await user.click(select);
    
    // Check that options have the correct data-value attributes
    const options = screen.getAllByRole('option');
    const flag1Option = options.find((opt) => opt.textContent === 'Flag One');
    expect(flag1Option?.getAttribute('data-value')).toBe('flag1');
  });
});
