import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdjustStep } from '@/components/AdjustStep';
import type { FlagSpec } from '@/flags/schema';

describe('AdjustStep', () => {
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
    overlayUrl: 'blob:test-overlay',
    isRendering: false,
    selectedFlag: mockFlag,
    presentation: 'ring' as const,
    onPresentationChange: vi.fn(),
    thickness: 10,
    onThicknessChange: vi.fn(),
    insetPct: 0,
    onInsetChange: vi.fn(),
    flagOffsetX: 0,
    onFlagOffsetChange: vi.fn(),
    segmentRotation: 0,
    onSegmentRotationChange: vi.fn(),
  };

  it('should render avatar preview with overlay image', () => {
    render(<AdjustStep {...defaultProps} />);
    
    const img = screen.getByAltText(`Avatar with ${mockFlag.displayName} border`) as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain('blob:test-overlay');
  });

  it('should render loading placeholder when overlayUrl is null and not rendering', () => {
    render(<AdjustStep {...defaultProps} overlayUrl={null} isRendering={false} />);
    
    expect(screen.getByText('Loading preview...')).toBeTruthy();
  });

  it('should render rendering placeholder when overlayUrl is null and rendering', () => {
    render(<AdjustStep {...defaultProps} overlayUrl={null} isRendering={true} />);
    
    expect(screen.getByText('Rendering...')).toBeTruthy();
  });

  it('should render presentation mode selector', () => {
    render(<AdjustStep {...defaultProps} />);
    
    expect(screen.getByText('Ring')).toBeTruthy();
    expect(screen.getByText('Segment')).toBeTruthy();
    expect(screen.getByText('Cutout')).toBeTruthy();
  });

  it('should render adjust controls', () => {
    render(<AdjustStep {...defaultProps} />);
    
    // Check for controls that AdjustControls renders
    expect(screen.getByText('Thinner')).toBeTruthy();
    expect(screen.getByText('Thicker')).toBeTruthy();
    expect(screen.getByText('Inset')).toBeTruthy();
    expect(screen.getByText('Outset')).toBeTruthy();
  });

  it('should pass presentation mode to PresentationModeSelector', () => {
    render(<AdjustStep {...defaultProps} presentation="segment" />);
    
    const segmentButton = screen.getByText('Segment').closest('button');
    expect(segmentButton?.className).toContain('selected');
  });

  it('should pass all control props to AdjustControls', () => {
    render(
      <AdjustStep
        {...defaultProps}
        thickness={15}
        insetPct={-5}
        flagOffsetX={100}
        segmentRotation={45}
        presentation="segment"
      />
    );
    
    // Verify values are displayed in controls
    expect(screen.getByText('15%')).toBeTruthy();
    expect(screen.getByText('-5%')).toBeTruthy();
    expect(screen.getByText('45°')).toBeTruthy();
  });

  it('should use correct alt text for avatar preview', () => {
    render(<AdjustStep {...defaultProps} />);
    
    const img = screen.getByAltText(`Avatar with ${mockFlag.displayName} border`);
    expect(img).toBeTruthy();
  });

  it('should use generic alt text when flag is null', () => {
    render(<AdjustStep {...defaultProps} selectedFlag={null} />);
    
    const img = screen.getByAltText('Avatar preview');
    expect(img).toBeTruthy();
  });
});

