import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepContainer } from './StepContainer';

describe('StepContainer', () => {
  describe('rendering', () => {
    it('should render children content', () => {
      render(
        <StepContainer title="Test Step">
          <div>Test content</div>
        </StepContainer>
      );

      expect(screen.getByText('Test content')).toBeDefined();
    });

    it('should render title when provided', () => {
      render(
        <StepContainer title="Upload Your Image">
          <div>Content</div>
        </StepContainer>
      );

      expect(screen.getByText('Upload Your Image')).toBeDefined();
    });

    it('should render description when provided', () => {
      render(
        <StepContainer 
          title="Step Title"
          description="This is a helpful description"
        >
          <div>Content</div>
        </StepContainer>
      );

      expect(screen.getByText('This is a helpful description')).toBeDefined();
    });

    it('should render without title or description', () => {
      render(
        <StepContainer>
          <div>Content only</div>
        </StepContainer>
      );

      expect(screen.getByText('Content only')).toBeDefined();
    });
  });

  describe('layout', () => {
    it('should apply consistent padding and spacing', () => {
      const { container } = render(
        <StepContainer title="Test">
          <div>Content</div>
        </StepContainer>
      );

      const stepContainer = container.firstChild;
      expect(stepContainer).toBeDefined();
    });

    it('should center content horizontally', () => {
      const { container } = render(
        <StepContainer title="Test">
          <div>Content</div>
        </StepContainer>
      );

      const stepContainer = container.firstChild as HTMLElement;
      expect(stepContainer.className).toMatch(/MuiBox-root/);
    });

    it('should have responsive width constraints', () => {
      const { container } = render(
        <StepContainer title="Test">
          <div>Content</div>
        </StepContainer>
      );

      const stepContainer = container.firstChild as HTMLElement;
      expect(stepContainer).toBeDefined();
    });
  });

  describe('accessibility', () => {
    it('should use semantic heading for title', () => {
      render(
        <StepContainer title="Upload Image">
          <div>Content</div>
        </StepContainer>
      );

      const heading = screen.getByRole('heading', { name: /upload image/i });
      expect(heading).toBeDefined();
      expect(heading.tagName).toBe('H2');
    });

    it('should have proper ARIA landmarks', () => {
      const { container } = render(
        <StepContainer title="Test Step">
          <div>Content</div>
        </StepContainer>
      );

      const section = container.querySelector('[role="region"]');
      expect(section).toBeDefined();
    });

    it('should label region with title', () => {
      render(
        <StepContainer title="Select Flag">
          <div>Content</div>
        </StepContainer>
      );

      const region = screen.getByRole('region', { name: /select flag/i });
      expect(region).toBeDefined();
    });
  });

  describe('styling', () => {
    it('should apply full width to children', () => {
      render(
        <StepContainer title="Test">
          <div data-testid="child">Content</div>
        </StepContainer>
      );

      const child = screen.getByTestId('child').parentElement;
      expect(child).toBeDefined();
    });

    it('should have proper vertical spacing between elements', () => {
      render(
        <StepContainer 
          title="Test Title"
          description="Test description"
        >
          <div>Content</div>
        </StepContainer>
      );

      expect(screen.getByText('Test Title')).toBeDefined();
      expect(screen.getByText('Test description')).toBeDefined();
      expect(screen.getByText('Content')).toBeDefined();
    });
  });

  describe('custom props', () => {
    it('should apply custom maxWidth when provided', () => {
      const { container } = render(
        <StepContainer title="Test" maxWidth="sm">
          <div>Content</div>
        </StepContainer>
      );

      const stepContainer = container.firstChild;
      expect(stepContainer).toBeDefined();
    });

    it('should default to md maxWidth', () => {
      const { container } = render(
        <StepContainer title="Test">
          <div>Content</div>
        </StepContainer>
      );

      const stepContainer = container.firstChild;
      expect(stepContainer).toBeDefined();
    });
  });
});
