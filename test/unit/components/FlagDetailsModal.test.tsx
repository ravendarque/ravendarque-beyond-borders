import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FlagDetailsModal } from '@/components/FlagDetailsModal';
import type { FlagSpec } from '@/flags/schema';

describe('FlagDetailsModal', () => {
  const mockFlag: FlagSpec = {
    id: 'test-flag',
    name: 'Test Flag Name',
    displayName: 'Test Flag',
    png_full: 'test.png',
    category: 'oppressed',
    reason: 'This is a test flag reason',
    references: [
      { url: 'https://example.com/ref1', text: 'Reference 1' },
      { url: 'https://example.com/ref2', text: 'Reference 2' },
    ],
    modes: {
      ring: {
        colors: ['#FF0000'],
      },
    },
  };

  it('should not render when flag is null', () => {
    const { container } = render(
      <FlagDetailsModal open={true} onOpenChange={vi.fn()} flag={null} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should not render when open is false', () => {
    render(
      <FlagDetailsModal open={false} onOpenChange={vi.fn()} flag={mockFlag} />
    );
    
    expect(screen.queryByText('Test Flag Name')).toBeFalsy();
  });

  it('should render flag name as title', () => {
    render(
      <FlagDetailsModal open={true} onOpenChange={vi.fn()} flag={mockFlag} />
    );
    
    expect(screen.getByText('Test Flag Name')).toBeTruthy();
  });

  it('should fallback to displayName when name is not available', () => {
    const flagWithoutName: FlagSpec = {
      ...mockFlag,
      name: undefined,
    };
    
    render(
      <FlagDetailsModal open={true} onOpenChange={vi.fn()} flag={flagWithoutName} />
    );
    
    expect(screen.getByText('Test Flag')).toBeTruthy();
  });

  it('should render reason when available', () => {
    render(
      <FlagDetailsModal open={true} onOpenChange={vi.fn()} flag={mockFlag} />
    );
    
    expect(screen.getByText('This is a test flag reason')).toBeTruthy();
  });

  it('should not render reason section when reason is not available', () => {
    const flagWithoutReason: FlagSpec = {
      ...mockFlag,
      reason: null,
    };
    
    render(
      <FlagDetailsModal open={true} onOpenChange={vi.fn()} flag={flagWithoutReason} />
    );
    
    expect(screen.queryByText('This is a test flag reason')).toBeFalsy();
  });

  it('should render references when available', () => {
    render(
      <FlagDetailsModal open={true} onOpenChange={vi.fn()} flag={mockFlag} />
    );
    
    expect(screen.getByText('Further reading')).toBeTruthy();
    expect(screen.getByText('Reference 1')).toBeTruthy();
    expect(screen.getByText('Reference 2')).toBeTruthy();
  });

  it('should not render references section when references are not available', () => {
    const flagWithoutReferences: FlagSpec = {
      ...mockFlag,
      references: null,
    };
    
    render(
      <FlagDetailsModal open={true} onOpenChange={vi.fn()} flag={flagWithoutReferences} />
    );
    
    expect(screen.queryByText('Further reading')).toBeFalsy();
  });

  it('should render close button', () => {
    render(
      <FlagDetailsModal open={true} onOpenChange={vi.fn()} flag={mockFlag} />
    );
    
    const closeButton = screen.getByLabelText(/close dialog/i);
    expect(closeButton).toBeTruthy();
  });

  it('should call onOpenChange with false when close button is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    
    render(
      <FlagDetailsModal open={true} onOpenChange={onOpenChange} flag={mockFlag} />
    );
    
    const closeButton = screen.getByLabelText(/close dialog/i);
    await user.click(closeButton);
    
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should render reference links with correct attributes', () => {
    render(
      <FlagDetailsModal open={true} onOpenChange={vi.fn()} flag={mockFlag} />
    );
    
    const link1 = screen.getByText('Reference 1') as HTMLAnchorElement;
    expect(link1.href).toBe('https://example.com/ref1');
    expect(link1.target).toBe('_blank');
    expect(link1.rel).toBe('noopener noreferrer');
  });
});

