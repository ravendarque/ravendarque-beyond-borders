import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { PrivacyModal } from '@/components/PrivacyModal';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('PrivacyModal', () => {
  it('should not render when open is false', () => {
    renderWithRouter(
      <PrivacyModal open={false} onOpenChange={vi.fn()} />
    );
    
    expect(screen.queryByText('Your Privacy is Protected')).toBeFalsy();
  });

  it('should render title when open', () => {
    renderWithRouter(
      <PrivacyModal open={true} onOpenChange={vi.fn()} />
    );
    
    expect(screen.getByText('Your Privacy is Protected')).toBeTruthy();
  });

  it('should render main privacy message', () => {
    renderWithRouter(
      <PrivacyModal open={true} onOpenChange={vi.fn()} />
    );
    
    expect(screen.getByText(/beyond borders processes everything/i)).toBeTruthy();
    expect(screen.getByText(/directly in your browser/i)).toBeTruthy();
  });

  it('should render privacy benefits list', () => {
    renderWithRouter(
      <PrivacyModal open={true} onOpenChange={vi.fn()} />
    );
    
    expect(screen.getByText(/no uploads to servers/i)).toBeTruthy();
    expect(screen.getByText(/no cloud storage/i)).toBeTruthy();
    expect(screen.getByText(/no tracking or analytics/i)).toBeTruthy();
    expect(screen.getByText(/complete privacy and control/i)).toBeTruthy();
  });

  it('should render technical explanation', () => {
    renderWithRouter(
      <PrivacyModal open={true} onOpenChange={vi.fn()} />
    );
    
    expect(screen.getByText(/html5 canvas technology/i)).toBeTruthy();
  });

  it('should render GitHub link', () => {
    renderWithRouter(
      <PrivacyModal open={true} onOpenChange={vi.fn()} />
    );
    
    const githubLink = screen.getByText(/here on github/i) as HTMLAnchorElement;
    expect(githubLink).toBeTruthy();
    expect(githubLink.href).toContain('github.com/ravendarque/ravendarque-beyond-borders');
    expect(githubLink.target).toBe('_blank');
    expect(githubLink.rel).toBe('noopener noreferrer');
  });

  it('should render ethics page link', () => {
    renderWithRouter(
      <PrivacyModal open={true} onOpenChange={vi.fn()} />
    );
    
    const ethicsLink = screen.getByText(/ethics, sustainability, and privacy statement/i);
    expect(ethicsLink).toBeTruthy();
  });

  it('should render close button', () => {
    renderWithRouter(
      <PrivacyModal open={true} onOpenChange={vi.fn()} />
    );
    
    const closeButton = screen.getByLabelText(/close dialog/i);
    expect(closeButton).toBeTruthy();
  });

  it('should call onOpenChange with false when close button is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    
    renderWithRouter(
      <PrivacyModal open={true} onOpenChange={onOpenChange} />
    );
    
    const closeButton = screen.getByLabelText(/close dialog/i);
    await user.click(closeButton);
    
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should render Got it button', () => {
    renderWithRouter(
      <PrivacyModal open={true} onOpenChange={vi.fn()} />
    );
    
    expect(screen.getByText('Got it')).toBeTruthy();
  });
});

