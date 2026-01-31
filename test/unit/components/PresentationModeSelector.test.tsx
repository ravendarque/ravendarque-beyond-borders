import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PresentationModeSelector } from '@/components/PresentationModeSelector';

describe('PresentationModeSelector', () => {
  it('should render all three mode buttons', () => {
    const onModeChange = vi.fn();

    render(<PresentationModeSelector mode="ring" onModeChange={onModeChange} />);

    expect(screen.getByText('Ring')).toBeTruthy();
    expect(screen.getByText('Segment')).toBeTruthy();
    expect(screen.getByText('Cutout')).toBeTruthy();
  });

  it('should mark ring button as selected when mode is ring', () => {
    const onModeChange = vi.fn();

    render(<PresentationModeSelector mode="ring" onModeChange={onModeChange} />);

    const ringButton = screen.getByText('Ring').closest('button');
    expect(ringButton?.className).toContain('selected');
    expect(ringButton?.getAttribute('aria-pressed')).toBe('true');
  });

  it('should mark segment button as selected when mode is segment', () => {
    const onModeChange = vi.fn();

    render(<PresentationModeSelector mode="segment" onModeChange={onModeChange} />);

    const segmentButton = screen.getByText('Segment').closest('button');
    expect(segmentButton?.className).toContain('selected');
    expect(segmentButton?.getAttribute('aria-pressed')).toBe('true');
  });

  it('should mark cutout button as selected when mode is cutout', () => {
    const onModeChange = vi.fn();

    render(<PresentationModeSelector mode="cutout" onModeChange={onModeChange} />);

    const cutoutButton = screen.getByText('Cutout').closest('button');
    expect(cutoutButton?.className).toContain('selected');
    expect(cutoutButton?.getAttribute('aria-pressed')).toBe('true');
  });

  it('should call onModeChange with ring when ring button is clicked', async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();

    render(<PresentationModeSelector mode="segment" onModeChange={onModeChange} />);

    const ringButton = screen.getByText('Ring').closest('button')!;
    await user.click(ringButton);

    expect(onModeChange).toHaveBeenCalledWith('ring');
  });

  it('should call onModeChange with segment when segment button is clicked', async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();

    render(<PresentationModeSelector mode="ring" onModeChange={onModeChange} />);

    const segmentButton = screen.getByText('Segment').closest('button')!;
    await user.click(segmentButton);

    expect(onModeChange).toHaveBeenCalledWith('segment');
  });

  it('should call onModeChange with cutout when cutout button is clicked', async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();

    render(<PresentationModeSelector mode="ring" onModeChange={onModeChange} />);

    const cutoutButton = screen.getByText('Cutout').closest('button')!;
    await user.click(cutoutButton);

    expect(onModeChange).toHaveBeenCalledWith('cutout');
  });

  it('should have correct ARIA labels for accessibility', () => {
    const onModeChange = vi.fn();

    render(<PresentationModeSelector mode="ring" onModeChange={onModeChange} />);

    const ringButton = screen.getByLabelText(/ring.*full circular border/i);
    const segmentButton = screen.getByLabelText(/segment.*partial arc/i);
    const cutoutButton = screen.getByLabelText(/cutout.*flag pattern fills/i);

    expect(ringButton).toBeTruthy();
    expect(segmentButton).toBeTruthy();
    expect(cutoutButton).toBeTruthy();
  });

  it('should have radiogroup role for accessibility', () => {
    const onModeChange = vi.fn();

    const { container } = render(
      <PresentationModeSelector mode="ring" onModeChange={onModeChange} />,
    );

    const radiogroup = container.querySelector('[role="radiogroup"]');
    expect(radiogroup).toBeTruthy();
    expect(radiogroup?.getAttribute('aria-label')).toBe('Presentation style');
  });

  it('should render SVG icons for each mode', () => {
    const onModeChange = vi.fn();

    const { container } = render(
      <PresentationModeSelector mode="ring" onModeChange={onModeChange} />,
    );

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(3); // One for each mode
  });
});
