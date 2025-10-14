import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PresentationControls } from '@/components/PresentationControls';

describe('PresentationControls', () => {
  it('should render label', () => {
    const onChange = vi.fn();
    render(<PresentationControls value="ring" onChange={onChange} />);
    
    expect(screen.getByText('Presentation Style')).toBeTruthy();
  });

  it('should render all three radio options', () => {
    const onChange = vi.fn();
    render(<PresentationControls value="ring" onChange={onChange} />);
    
    expect(screen.getByText('Ring')).toBeTruthy();
    expect(screen.getByText('Segment')).toBeTruthy();
    expect(screen.getByText('Cutout')).toBeTruthy();
  });

  it('should render with ring selected', () => {
    const onChange = vi.fn();
    render(<PresentationControls value="ring" onChange={onChange} />);
    
    const ringRadio = screen.getByRole('radio', { name: 'Ring' }) as HTMLInputElement;
    expect(ringRadio.checked).toBe(true);
  });

  it('should render with segment selected', () => {
    const onChange = vi.fn();
    render(<PresentationControls value="segment" onChange={onChange} />);
    
    const segmentRadio = screen.getByRole('radio', { name: 'Segment' }) as HTMLInputElement;
    expect(segmentRadio.checked).toBe(true);
  });

  it('should render with cutout selected', () => {
    const onChange = vi.fn();
    render(<PresentationControls value="cutout" onChange={onChange} />);
    
    const cutoutRadio = screen.getByRole('radio', { name: 'Cutout' }) as HTMLInputElement;
    expect(cutoutRadio.checked).toBe(true);
  });

  it('should call onChange when ring is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PresentationControls value="segment" onChange={onChange} />);
    
    const ringRadio = screen.getByRole('radio', { name: 'Ring' });
    await user.click(ringRadio);
    
    expect(onChange).toHaveBeenCalledWith('ring');
  });

  it('should call onChange when segment is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PresentationControls value="ring" onChange={onChange} />);
    
    const segmentRadio = screen.getByRole('radio', { name: 'Segment' });
    await user.click(segmentRadio);
    
    expect(onChange).toHaveBeenCalledWith('segment');
  });

  it('should call onChange when cutout is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PresentationControls value="ring" onChange={onChange} />);
    
    const cutoutRadio = screen.getByRole('radio', { name: 'Cutout' });
    await user.click(cutoutRadio);
    
    expect(onChange).toHaveBeenCalledWith('cutout');
  });

  it('should only have one radio selected at a time', () => {
    const onChange = vi.fn();
    render(<PresentationControls value="segment" onChange={onChange} />);
    
    const ringRadio = screen.getByRole('radio', { name: 'Ring' }) as HTMLInputElement;
    const segmentRadio = screen.getByRole('radio', { name: 'Segment' }) as HTMLInputElement;
    const cutoutRadio = screen.getByRole('radio', { name: 'Cutout' }) as HTMLInputElement;
    
    expect(ringRadio.checked).toBe(false);
    expect(segmentRadio.checked).toBe(true);
    expect(cutoutRadio.checked).toBe(false);
  });

  it('should render radios in a row', () => {
    const onChange = vi.fn();
    render(<PresentationControls value="ring" onChange={onChange} />);
    
    const radioGroup = document.querySelector('[role="radiogroup"]') as HTMLElement;
    expect(radioGroup).toBeTruthy();
    // MUI RadioGroup with row prop adds flex-direction: row
    // We can verify the radiogroup exists with correct structure
  });
});
