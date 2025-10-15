import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    expect(fileInput.accept).toBe('image/*');
  });

  it('should have correct id for label association', () => {
    const onFileChange = vi.fn();
    render(<ImageUploader onFileChange={onFileChange} />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const label = document.querySelector('label[for="file-upload"]');
    
    expect(fileInput.id).toBe('file-upload');
    expect(label).toBeTruthy();
  });

  it('should call onFileChange when file is selected', async () => {
    const user = userEvent.setup();
    const onFileChange = vi.fn();
    render(<ImageUploader onFileChange={onFileChange} />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    
    await user.upload(fileInput, file);
    
    expect(onFileChange).toHaveBeenCalled();
  });

  it('should handle multiple file selections', async () => {
    const user = userEvent.setup();
    const onFileChange = vi.fn();
    render(<ImageUploader onFileChange={onFileChange} />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file1 = new File(['test1'], 'test1.png', { type: 'image/png' });
    
    // First selection
    await user.upload(fileInput, file1);
    expect(onFileChange).toHaveBeenCalledTimes(1);
    
    const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });
    
    // Second selection
    await user.upload(fileInput, file2);
    expect(onFileChange).toHaveBeenCalledTimes(2);
  });

  it('should pass event to onFileChange callback', async () => {
    const user = userEvent.setup();
    const onFileChange = vi.fn();
    render(<ImageUploader onFileChange={onFileChange} />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    
    await user.upload(fileInput, file);
    
    // Check that the callback received a change event
    expect(onFileChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          files: expect.any(FileList),
        }),
      })
    );
  });

  it('should render upload icon', () => {
    const onFileChange = vi.fn();
    render(<ImageUploader onFileChange={onFileChange} />);
    
    // MUI FileUploadIcon renders as an svg
    const icon = document.querySelector('svg');
    expect(icon).toBeTruthy();
  });
});
