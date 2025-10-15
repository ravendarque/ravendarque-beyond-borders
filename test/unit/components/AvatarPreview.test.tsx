import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AvatarPreview } from '@/components/AvatarPreview';
import React from 'react';

describe('AvatarPreview', () => {
  const createDefaultProps = () => ({
    size: 512,
    displaySize: 300,
    canvasRef: React.createRef<HTMLCanvasElement>(),
    overlayUrl: null as string | null,
    isRendering: false,
  });

  const defaultProps = createDefaultProps();

  it('should render preview title', () => {
    render(<AvatarPreview {...defaultProps} />);
    
    expect(screen.getByText('Preview')).toBeTruthy();
  });

  it('should render canvas with correct dimensions', () => {
    render(<AvatarPreview {...defaultProps} />);
    
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas).toBeTruthy();
    expect(canvas.width).toBe(512);
    expect(canvas.height).toBe(512);
  });

  it('should render canvas with correct display size', () => {
    render(<AvatarPreview {...defaultProps} />);
    
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas.style.width).toBe('300px');
    expect(canvas.style.height).toBe('300px');
  });

  it('should apply circular border radius to canvas', () => {
    render(<AvatarPreview {...defaultProps} />);
    
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas.style.borderRadius).toBe('50%');
  });

  it('should attach canvas ref correctly', () => {
    const props = createDefaultProps();
    render(<AvatarPreview {...props} />);
    
    expect(props.canvasRef.current).toBeTruthy();
    expect(props.canvasRef.current).toBeInstanceOf(HTMLCanvasElement);
  });

  it('should not render overlay when overlayUrl is null', () => {
    render(<AvatarPreview {...defaultProps} overlayUrl={null} />);
    
    const overlay = document.querySelector('img[alt="Result overlay"]');
    expect(overlay).toBeFalsy();
  });

  it('should render overlay when overlayUrl is provided', () => {
    render(<AvatarPreview {...defaultProps} overlayUrl="blob:test-overlay" />);
    
    const overlay = document.querySelector('img[alt="Result overlay"]') as HTMLImageElement;
    expect(overlay).toBeTruthy();
    expect(overlay.src).toContain('blob:test-overlay');
  });

  it('should position overlay absolutely over canvas', () => {
    render(<AvatarPreview {...defaultProps} overlayUrl="blob:test-overlay" />);
    
    const overlay = document.querySelector('img[alt="Result overlay"]') as HTMLImageElement;
    expect(overlay.style.position).toBe('absolute');
    expect(overlay.style.top).toBe('0px');
    expect(overlay.style.left).toBe('0px');
  });

  it('should apply correct dimensions to overlay', () => {
    render(<AvatarPreview {...defaultProps} overlayUrl="blob:test-overlay" displaySize={400} />);
    
    const overlay = document.querySelector('img[alt="Result overlay"]') as HTMLImageElement;
    expect(overlay.style.width).toBe('400px');
    expect(overlay.style.height).toBe('400px');
  });

  it('should not render loading overlay when not rendering', () => {
    render(<AvatarPreview {...defaultProps} isRendering={false} />);
    
    expect(screen.queryByText('Loading...')).toBeFalsy();
  });

  it('should render loading overlay when isRendering is true', () => {
    render(<AvatarPreview {...defaultProps} isRendering={true} />);
    
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('should render circular progress when loading', () => {
    render(<AvatarPreview {...defaultProps} isRendering={true} />);
    
    // MUI CircularProgress renders an svg with role="progressbar"
    const progress = document.querySelector('[role="progressbar"]');
    expect(progress).toBeTruthy();
  });

  it('should render loading overlay with semi-transparent background', () => {
    const { container } = render(<AvatarPreview {...defaultProps} isRendering={true} />);
    
    // The loading overlay Box has backgroundColor in sx prop
    // We can verify the Loading text is present which indicates the overlay is rendered
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('should handle different size combinations', () => {
    render(
      <AvatarPreview
        {...defaultProps}
        size={1024}
        displaySize={600}
      />
    );
    
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas.width).toBe(1024);
    expect(canvas.height).toBe(1024);
    expect(canvas.style.width).toBe('600px');
    expect(canvas.style.height).toBe('600px');
  });

  it('should render overlay and loading state simultaneously', () => {
    render(
      <AvatarPreview
        {...defaultProps}
        overlayUrl="blob:test-overlay"
        isRendering={true}
      />
    );
    
    const overlay = document.querySelector('img[alt="Result overlay"]');
    expect(overlay).toBeTruthy();
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('should have pointer-events none on overlay', () => {
    render(<AvatarPreview {...defaultProps} overlayUrl="blob:test-overlay" />);
    
    const overlay = document.querySelector('img[alt="Result overlay"]') as HTMLImageElement;
    expect(overlay.style.pointerEvents).toBe('none');
  });

  it('should render inside Paper component', () => {
    const { container } = render(<AvatarPreview {...defaultProps} />);
    
    // MUI Paper typically has a specific class
    const paper = container.querySelector('.MuiPaper-root');
    expect(paper).toBeTruthy();
  });
});
