import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageUploadZone } from '@/components/ImageUploadZone';
import type { ImagePosition, PositionLimits, ImageAspectRatio, ImageDimensions } from '@/utils/imagePosition';

// Default props for tests
const defaultProps = {
  position: { x: 0, y: 0, zoom: 0 } as ImagePosition,
  limits: { minX: 0, maxX: 0, minY: 0, maxY: 0 } as PositionLimits,
  aspectRatio: null as ImageAspectRatio | null,
  imageDimensions: null as ImageDimensions | null,
  onPositionChange: vi.fn(),
  circleSize: 250,
};

describe('ImageUploadZone', () => {
  it('should render file input with correct attributes', () => {
    const onImageUpload = vi.fn();
    const onShowPrivacy = vi.fn();
    
    render(<ImageUploadZone 
      imageUrl={null} 
      onImageUpload={onImageUpload} 
      onShowPrivacy={onShowPrivacy}
      {...defaultProps}
    />);
    
    const input = screen.getByLabelText(/choose image file/i) as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.type).toBe('file');
    expect(input.accept).toBe('image/jpeg,image/jpg,image/png');
    expect(input.style.display).toBe('none');
  });

  it('should render upload zone when no image is selected', () => {
    const onImageUpload = vi.fn();
    const onShowPrivacy = vi.fn();
    
    render(<ImageUploadZone 
      imageUrl={null} 
      onImageUpload={onImageUpload} 
      onShowPrivacy={onShowPrivacy}
      {...defaultProps}
    />);
    
    expect(screen.getByText('Choose your profile picture')).toBeTruthy();
    expect(screen.getByText('JPG or PNG')).toBeTruthy();
    expect(screen.getByLabelText(/learn about privacy/i)).toBeTruthy();
  });

  it('should render privacy button with correct text', () => {
    const onImageUpload = vi.fn();
    const onShowPrivacy = vi.fn();
    
    render(<ImageUploadZone 
      imageUrl={null} 
      onImageUpload={onImageUpload} 
      onShowPrivacy={onShowPrivacy}
      {...defaultProps}
    />);
    
    const privacyButton = screen.getByText('Stays on your device');
    expect(privacyButton).toBeTruthy();
  });

  it('should call onShowPrivacy when privacy button is clicked', async () => {
    const user = userEvent.setup();
    const onImageUpload = vi.fn();
    const onShowPrivacy = vi.fn();
    
    render(<ImageUploadZone 
      imageUrl={null} 
      onImageUpload={onImageUpload} 
      onShowPrivacy={onShowPrivacy}
      {...defaultProps}
    />);
    
    const privacyButton = screen.getByText('Stays on your device');
    await user.click(privacyButton);
    
    expect(onShowPrivacy).toHaveBeenCalledTimes(1);
  });

  it('should apply has-image class when imageUrl is provided', () => {
    const onImageUpload = vi.fn();
    const onShowPrivacy = vi.fn();
    const imageUrl = 'blob:test-image';
    
    render(<ImageUploadZone 
      imageUrl={imageUrl} 
      onImageUpload={onImageUpload} 
      onShowPrivacy={onShowPrivacy}
      {...defaultProps}
    />);
    
    const label = screen.getByLabelText(/choose your profile picture/i);
    expect(label.className).toContain('has-image');
  });

  it('should set background image style when imageUrl is provided', () => {
    const onImageUpload = vi.fn();
    const onShowPrivacy = vi.fn();
    const imageUrl = 'blob:test-image';
    
    render(<ImageUploadZone 
      imageUrl={imageUrl} 
      onImageUpload={onImageUpload} 
      onShowPrivacy={onShowPrivacy}
      {...defaultProps}
    />);
    
    const label = screen.getByLabelText(/choose your profile picture/i) as HTMLLabelElement;
    expect(label.style.backgroundImage).toContain(imageUrl);
    expect(label.style.backgroundSize).toBe('cover');
    // backgroundPosition is set via positionToBackgroundPosition which returns percentage values
    // Default position (0, 0) results in "50% 50%" (center)
    expect(label.style.backgroundPosition).toBe('50% 50%');
  });

  it('should not render upload prompt when imageUrl is provided', () => {
    const onImageUpload = vi.fn();
    const onShowPrivacy = vi.fn();
    const imageUrl = 'blob:test-image';
    
    render(<ImageUploadZone 
      imageUrl={imageUrl} 
      onImageUpload={onImageUpload} 
      onShowPrivacy={onShowPrivacy}
      {...defaultProps}
    />);
    
    expect(screen.queryByText('Choose your profile picture')).toBeFalsy();
    expect(screen.queryByText('JPG or PNG')).toBeFalsy();
    expect(screen.queryByText('Stays on your device')).toBeFalsy();
  });

  it('should call onImageUpload when file is selected', async () => {
    const user = userEvent.setup();
    const onImageUpload = vi.fn();
    const onShowPrivacy = vi.fn();
    
    render(<ImageUploadZone 
      imageUrl={null} 
      onImageUpload={onImageUpload} 
      onShowPrivacy={onShowPrivacy}
      {...defaultProps}
    />);
    
    const input = screen.getByLabelText(/choose image file/i) as HTMLInputElement;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    await user.upload(input, file);
    
    expect(onImageUpload).toHaveBeenCalledTimes(1);
    expect(onImageUpload).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({
        files: expect.any(FileList),
      }),
    }));
  });

  it('should have correct label association with file input', () => {
    const onImageUpload = vi.fn();
    const onShowPrivacy = vi.fn();
    
    render(<ImageUploadZone 
      imageUrl={null} 
      onImageUpload={onImageUpload} 
      onShowPrivacy={onShowPrivacy}
      {...defaultProps}
    />);
    
    const input = screen.getByLabelText(/choose image file/i);
    const labels = screen.getAllByLabelText(/choose your profile picture/i);
    const label = labels.find(el => el.tagName === 'LABEL') as HTMLLabelElement;
    
    expect(label.getAttribute('for')).toBe('step1-file-upload');
    expect(input.id).toBe('step1-file-upload');
  });
});

