import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step1PositionControls } from '@/components/Step1PositionControls';
import type { ImagePosition, PositionLimits } from '@/utils/imagePosition';

const defaultPosition: ImagePosition = { x: 0, y: 0, zoom: 100 };
const defaultLimits: PositionLimits = { minX: -10, maxX: 10, minY: -10, maxY: 10 };

describe('Step1PositionControls', () => {
  it('renders horizontal, vertical, and zoom sliders with labels', () => {
    render(
      <Step1PositionControls
        position={defaultPosition}
        limits={defaultLimits}
        onPositionChange={vi.fn()}
      />
    );
    expect(screen.getByText('Move left')).toBeTruthy();
    expect(screen.getByText('Move right')).toBeTruthy();
    expect(screen.getByText('Move up')).toBeTruthy();
    expect(screen.getByText('Move down')).toBeTruthy();
    expect(screen.getByText('Zoom Out')).toBeTruthy();
    expect(screen.getByText('Zoom In')).toBeTruthy();
  });

  it('displays current position and zoom values', () => {
    render(
      <Step1PositionControls
        position={{ x: -20, y: 15, zoom: 150 }}
        limits={defaultLimits}
        onPositionChange={vi.fn()}
      />
    );
    expect(screen.getByText('-20%')).toBeTruthy();
    expect(screen.getByText('15%')).toBeTruthy();
    expect(screen.getByText('150%')).toBeTruthy();
  });

  it('renders three sliders (horizontal, vertical, zoom)', () => {
    render(
      <Step1PositionControls
        position={defaultPosition}
        limits={defaultLimits}
        onPositionChange={vi.fn()}
      />
    );
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBe(3);
  });

  it('calls onPositionChange when zoom slider value changes', async () => {
    const user = userEvent.setup();
    const onPositionChange = vi.fn();
    render(
      <Step1PositionControls
        position={defaultPosition}
        limits={defaultLimits}
        onPositionChange={onPositionChange}
      />
    );
    const sliders = screen.getAllByRole('slider');
    const zoomSlider = sliders[2];
    zoomSlider.focus();
    await user.keyboard('{ArrowRight}');
    expect(onPositionChange).toHaveBeenCalled();
    expect(onPositionChange.mock.calls[0][0]).toMatchObject({
      x: 0,
      y: 0,
      zoom: expect.any(Number),
    });
  });
});
