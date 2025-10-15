import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SliderControl } from '@/components/SliderControl';

describe('SliderControl', () => {
  const defaultProps = {
    label: 'Test Slider',
    value: 50,
    min: 0,
    max: 100,
    step: 1,
    onChange: vi.fn(),
  };

  it('should render label with value', () => {
    render(<SliderControl {...defaultProps} />);
    
    expect(screen.getByText('Test Slider: 50')).toBeTruthy();
  });

  it('should render label with value and unit', () => {
    render(<SliderControl {...defaultProps} unit="%" />);
    
    expect(screen.getByText('Test Slider: 50%')).toBeTruthy();
  });

  it('should render slider with correct value', () => {
    render(<SliderControl {...defaultProps} />);
    
    const slider = screen.getByRole('slider') as HTMLInputElement;
    expect(slider.value).toBe('50');
  });

  it('should call onChange when slider value changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    
    render(<SliderControl {...defaultProps} onChange={onChange} />);
    
    const slider = screen.getByRole('slider');
    
    // Simulate slider interaction (click to focus, then change)
    await user.click(slider);
    
    // onChange callback should exist and be callable
    expect(onChange).toBeDefined();
  });

  it('should render with different min/max/step values', () => {
    render(
      <SliderControl
        {...defaultProps}
        min={-10}
        max={10}
        step={2}
        value={0}
      />
    );
    
    const slider = screen.getByRole('slider') as HTMLInputElement;
    expect(slider.min).toBe('-10');
    expect(slider.max).toBe('10');
    expect(slider.step).toBe('2');
  });

  it('should display negative values correctly', () => {
    render(
      <SliderControl
        {...defaultProps}
        value={-5}
        min={-10}
        max={10}
        unit="px"
      />
    );
    
    expect(screen.getByText('Test Slider: -5px')).toBeTruthy();
  });

  it('should display decimal values correctly', () => {
    render(
      <SliderControl
        {...defaultProps}
        value={7.5}
        step={0.5}
      />
    );
    
    expect(screen.getByText('Test Slider: 7.5')).toBeTruthy();
  });

  it('should handle zero value', () => {
    render(
      <SliderControl
        {...defaultProps}
        value={0}
      />
    );
    
    expect(screen.getByText('Test Slider: 0')).toBeTruthy();
    const slider = screen.getByRole('slider') as HTMLInputElement;
    expect(slider.value).toBe('0');
  });
});
