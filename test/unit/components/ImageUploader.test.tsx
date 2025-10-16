import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageUploader } from '@/components/ImageUploader';

describe('ImageUploader', () => {
  it('should render upload button', () => {
    const onFileChange = vi.fn();
    render(<ImageUploader onFileChange={onFileChange} />);
    
    expect(screen.getByText('Choose Image')).toBeTruthy();
  });

  it('should render hidden file input', () => {
    const onFileChange = vi.fn();
    render(<ImageUploader onFileChange={onFileChange} />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();
    expect(fileInput.style.display).toBe('none');
  });

  it('should have correct accept attribute for images', () => {
    const onFileChange = vi.fn();
    render(<ImageUploader onFileChange={onFileChange} />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    // Accept attribute is now specific to supported formats
    expect(fileInput.accept).toBe('image/jpeg,image/jpg,image/png');
  });

  it('should have correct id for label association', () => {
    const onFileChange = vi.fn();
    render(<ImageUploader onFileChange={onFileChange} />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const label = document.querySelector('label[for="file-upload"]');
    
    expect(fileInput.id).toBe('file-upload');
    expect(label).toBeTruthy();
  });

  it('should render drag and drop hint text', () => {
    const onFileChange = vi.fn();
    render(<ImageUploader onFileChange={onFileChange} />);
    
    expect(screen.getByText('or drag and drop')).toBeTruthy();
  });

  it('should have file input with proper ARIA label', () => {
    const onFileChange = vi.fn();
    render(<ImageUploader onFileChange={onFileChange} />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput.getAttribute('aria-label')).toContain('Upload image file');
  });

  it('should render button with accessible label', () => {
    const onFileChange = vi.fn();
    render(<ImageUploader onFileChange={onFileChange} />);
    
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-label')).toContain('Choose image file to upload or drag and drop');
  });

  it('should render upload icon', () => {
    const onFileChange = vi.fn();
    render(<ImageUploader onFileChange={onFileChange} />);
    
    // MUI FileUploadIcon renders as an svg
    const icon = document.querySelector('svg');
    expect(icon).toBeTruthy();
  });
});
