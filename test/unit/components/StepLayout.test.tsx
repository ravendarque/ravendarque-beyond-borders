import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepLayout } from '@/components/StepLayout';

describe('StepLayout', () => {
  it('renders main content', () => {
    render(
      <StepLayout mainContent={<span data-testid="main">Main content</span>} />
    );
    expect(screen.getByTestId('main')).toBeTruthy();
    expect(screen.getByText('Main content')).toBeTruthy();
  });

  it('does not render controls section when controls is undefined', () => {
    const { container } = render(
      <StepLayout mainContent={<div>Main</div>} />
    );
    expect(container.querySelector('.step-layout__controls')).toBeNull();
  });

  it('does not render controls section when controls is not passed', () => {
    const { container } = render(
      <StepLayout mainContent={<div>Main</div>} />
    );
    expect(container.querySelector('.step-layout__controls')).toBeNull();
  });

  it('renders controls section when controls is provided', () => {
    render(
      <StepLayout
        mainContent={<div>Main</div>}
        controls={<span data-testid="controls">Controls</span>}
      />
    );
    expect(screen.getByTestId('controls')).toBeTruthy();
    expect(screen.getByText('Controls')).toBeTruthy();
  });

  it('uses step-layout and step-layout__main classes', () => {
    const { container } = render(
      <StepLayout mainContent={<div>Main</div>} />
    );
    expect(container.querySelector('.step-layout')).toBeTruthy();
    expect(container.querySelector('.step-layout__main')).toBeTruthy();
  });
});
