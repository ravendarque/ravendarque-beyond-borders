import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ControlPanel } from '@/components/ControlPanel';
import type { FlagSpec } from '@/flags/schema';

describe('ControlPanel', () => {
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
  ];

  const defaultProps = {
    onFileChange: vi.fn(),
    flagId: '',
    flags: mockFlags,
    onFlagChange: vi.fn(),
    presentation: 'ring' as const,
    onPresentationChange: vi.fn(),
    thickness: 7,
    onThicknessChange: vi.fn(),
    insetPct: 0,
    onInsetPctChange: vi.fn(),
    flagOffsetX: 0,
    onFlagOffsetXChange: vi.fn(),
    bg: 'transparent' as const,
    onBgChange: vi.fn(),
    onDownload: vi.fn(),
    downloadDisabled: false,
    hasImage: true, // Enable sections for testing
  };

  it('should render ImageUploader component', () => {
    render(<ControlPanel {...defaultProps} />);
    
    expect(screen.getByText('Choose Image')).toBeTruthy();
  });

  it('should render FlagSelector component', () => {
    render(<ControlPanel {...defaultProps} />);
    
    // FlagSelector renders "Select a flag" in multiple places
    const labels = screen.getAllByText('Select a flag');
    expect(labels.length).toBeGreaterThan(0);
  });

  it('should render PresentationControls component', () => {
    render(<ControlPanel {...defaultProps} />);
    
    expect(screen.getByText('Presentation Style')).toBeTruthy();
    expect(screen.getByText('Ring')).toBeTruthy();
    expect(screen.getByText('Segment')).toBeTruthy();
    expect(screen.getByText('Cutout')).toBeTruthy();
  });

  it('should render Border thickness slider', () => {
    render(<ControlPanel {...defaultProps} />);
    
    expect(screen.getByText('Border thickness: 7%')).toBeTruthy();
  });

  it('should render Inset/Outset slider', () => {
    render(<ControlPanel {...defaultProps} />);
    
    expect(screen.getByText('Profile Image Inset/Outset: 0%')).toBeTruthy();
  });

  it('should not render Flag Offset slider when presentation is ring', () => {
    render(<ControlPanel {...defaultProps} presentation="ring" />);
    
    expect(screen.queryByText(/Flag Offset/)).toBeFalsy();
  });

  it('should not render Flag Offset slider when presentation is segment', () => {
    render(<ControlPanel {...defaultProps} presentation="segment" />);
    
    expect(screen.queryByText(/Flag Offset/)).toBeFalsy();
  });

  it('should render Flag Offset slider when presentation is cutout', () => {
    render(<ControlPanel {...defaultProps} presentation="cutout" flagId="flag1" />);
    
    expect(screen.getByText('Flag Horizontal Offset: 0px')).toBeTruthy();
  });

  it('should render Background selector', () => {
    render(<ControlPanel {...defaultProps} />);
    
    const labels = screen.getAllByText('Background');
    expect(labels.length).toBeGreaterThan(0);
  });

  it('should render Download button', () => {
    render(<ControlPanel {...defaultProps} />);
    
    expect(screen.getByText('Download')).toBeTruthy();
  });

  it('should render Download button as enabled when not disabled', () => {
    render(<ControlPanel {...defaultProps} downloadDisabled={false} />);
    
    const button = screen.getByText('Download').closest('button') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('should render Download button as disabled when disabled', () => {
    render(<ControlPanel {...defaultProps} downloadDisabled={true} />);
    
    const button = screen.getByText('Download').closest('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should call onDownload when Download button is clicked', async () => {
    const user = userEvent.setup();
    const onDownload = vi.fn();
    
    render(<ControlPanel {...defaultProps} onDownload={onDownload} />);
    
    const button = screen.getByText('Download');
    await user.click(button);
    
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it('should call onBgChange when background is changed', async () => {
    const user = userEvent.setup();
    const onBgChange = vi.fn();
    
    render(<ControlPanel {...defaultProps} onBgChange={onBgChange} flagId="flag1" />);
    
    // Open the background dropdown
    const bgSelects = document.querySelectorAll('[role="combobox"]');
    const bgSelect = Array.from(bgSelects).find((el) => {
      const parent = el.closest('.MuiFormControl-root');
      return parent?.textContent?.includes('Background');
    }) as HTMLElement;
    
    await user.click(bgSelect);
    
    // Select White
    const whiteOption = screen.getByText('White');
    await user.click(whiteOption);
    
    expect(onBgChange).toHaveBeenCalledWith('#ffffff');
  });

  it('should pass flags to FlagSelector', () => {
    render(<ControlPanel {...defaultProps} flags={mockFlags} />);
    
    // Verify the component renders (flags are passed internally)
    const labels = screen.getAllByText('Select a flag');
    expect(labels.length).toBeGreaterThan(0);
  });

  it('should pass flagId to FlagSelector', () => {
    render(<ControlPanel {...defaultProps} flagId="flag1" />);
    
    // When a flag is selected, its displayName should be visible
    expect(screen.getByText('Flag One')).toBeTruthy();
  });

  it('should render all controls in Stack layout', () => {
    const { container } = render(<ControlPanel {...defaultProps} />);
    
    // MUI Stack component
    const stack = container.querySelector('.MuiStack-root');
    expect(stack).toBeTruthy();
  });

  it('should render inside Paper component', () => {
    const { container } = render(<ControlPanel {...defaultProps} />);
    
    const paper = container.querySelector('.MuiPaper-root');
    expect(paper).toBeTruthy();
  });

  it('should render with different slider values', () => {
    render(
      <ControlPanel
        {...defaultProps}
        thickness={15}
        insetPct={-5}
        flagOffsetX={100}
        presentation="cutout"
        flagId="flag1"
      />
    );
    
    expect(screen.getByText('Border thickness: 15%')).toBeTruthy();
    expect(screen.getByText('Profile Image Inset/Outset: -5%')).toBeTruthy();
    expect(screen.getByText('Flag Horizontal Offset: 100px')).toBeTruthy();
  });

  it('should render download icon', () => {
    render(<ControlPanel {...defaultProps} />);
    
    // MUI DownloadIcon renders as an svg
    const button = screen.getByText('Download').closest('button');
    const icon = button?.querySelector('svg');
    expect(icon).toBeTruthy();
  });
});
