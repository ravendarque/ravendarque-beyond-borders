import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdjustControls } from '@/components/AdjustControls';
import type { FlagSpec } from '@/flags/schema';

describe('AdjustControls', () => {
  const mockFlag: FlagSpec = {
    id: 'test-flag',
    displayName: 'Test Flag',
    png_full: 'test.png',
    category: 'oppressed',
    modes: {
      ring: {
        colors: ['#FF0000'],
      },
    },
  };

  const defaultProps = {
    thickness: 10,
    onThicknessChange: vi.fn(),
    flagOffsetPct: 0, // Percentage: -50 to +50
    onFlagOffsetChange: vi.fn(),
    presentation: 'ring' as const,
    segmentRotation: 0,
    onSegmentRotationChange: vi.fn(),
    selectedFlag: mockFlag,
  };

  it('should render thickness slider', () => {
    render(<AdjustControls {...defaultProps} />);

    expect(screen.getByText('Thinner')).toBeTruthy();
    expect(screen.getByText('Thicker')).toBeTruthy();
    expect(screen.getByText('10%')).toBeTruthy();
  });

  it('should display correct thickness value', () => {
    render(<AdjustControls {...defaultProps} thickness={15} />);

    expect(screen.getByText('15%')).toBeTruthy();
  });

  it('should not render rotation slider when presentation is not segment', () => {
    render(<AdjustControls {...defaultProps} presentation="ring" />);

    expect(screen.queryByText(/rotate/i)).toBeFalsy();
  });

  it('should render rotation slider when presentation is segment', () => {
    render(<AdjustControls {...defaultProps} presentation="segment" />);

    expect(screen.getByText('Rotate R')).toBeTruthy();
    expect(screen.getByText('Rotate L')).toBeTruthy();
    expect(screen.getByText('0°')).toBeTruthy();
  });

  it('should display correct rotation value', () => {
    render(<AdjustControls {...defaultProps} presentation="segment" segmentRotation={45} />);

    expect(screen.getByText('45°')).toBeTruthy();
  });

  it('should not render flag offset slider when presentation is not cutout', () => {
    render(<AdjustControls {...defaultProps} presentation="ring" />);

    expect(screen.queryByText(/flag [lr]/i)).toBeFalsy();
  });

  it('should not render flag offset slider when cutout mode but offsetEnabled is false', () => {
    const flagWithoutOffset: FlagSpec = {
      ...mockFlag,
      modes: {
        ring: { colors: ['#FF0000'] },
        cutout: {
          offsetEnabled: false,
          defaultOffset: 0,
        },
      },
    };

    render(
      <AdjustControls {...defaultProps} presentation="cutout" selectedFlag={flagWithoutOffset} />,
    );

    expect(screen.queryByText(/flag [lr]/i)).toBeFalsy();
  });

  it('should render flag offset slider when cutout mode and offsetEnabled is true', () => {
    const flagWithOffset: FlagSpec = {
      ...mockFlag,
      modes: {
        ring: { colors: ['#FF0000'] },
        cutout: {
          offsetEnabled: true,
          defaultOffset: -50,
        },
      },
    };

    render(
      <AdjustControls {...defaultProps} presentation="cutout" selectedFlag={flagWithOffset} />,
    );

    expect(screen.getByText('Flag L')).toBeTruthy();
    expect(screen.getByText('Flag R')).toBeTruthy();
  });

  it('should display correct flag offset percentage', () => {
    const flagWithOffset: FlagSpec = {
      ...mockFlag,
      modes: {
        ring: { colors: ['#FF0000'] },
        cutout: {
          offsetEnabled: true,
          defaultOffset: -50,
        },
      },
    };

    // flagOffsetX is now a percentage value (-50 to +50)
    render(
      <AdjustControls
        {...defaultProps}
        presentation="cutout"
        selectedFlag={flagWithOffset}
        flagOffsetPct={25}
      />,
    );

    expect(screen.getByText('25%')).toBeTruthy();
  });

  it('should have correct ARIA labels for sliders', () => {
    render(<AdjustControls {...defaultProps} />);

    const thicknessSlider = screen.getByLabelText('Border thickness');

    expect(thicknessSlider).toBeTruthy();
  });

  it('should have correct ARIA label for rotation slider when in segment mode', () => {
    render(<AdjustControls {...defaultProps} presentation="segment" />);

    const rotationSlider = screen.getByLabelText('Segment rotation');
    expect(rotationSlider).toBeTruthy();
  });

  it('should have correct ARIA label for flag offset slider when in cutout mode', () => {
    const flagWithOffset: FlagSpec = {
      ...mockFlag,
      modes: {
        ring: { colors: ['#FF0000'] },
        cutout: {
          offsetEnabled: true,
          defaultOffset: 0,
        },
      },
    };

    render(
      <AdjustControls {...defaultProps} presentation="cutout" selectedFlag={flagWithOffset} />,
    );

    const offsetSlider = screen.getByLabelText('Flag horizontal offset');
    expect(offsetSlider).toBeTruthy();
  });
});
