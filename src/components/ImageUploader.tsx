import React from 'react';
import Button from '@mui/material/Button';
import FileUploadIcon from '@mui/icons-material/UploadFile';
import { FileValidationError } from '@/types/errors';

export interface ImageUploaderProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onError?: (error: FileValidationError) => void;
}

// Validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_DIMENSION = 4096; // 4K resolution

/**
 * Validate image file dimensions
 */
async function validateImageDimensions(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
        reject(
          FileValidationError.dimensionsTooLarge(
            img.width,
            img.height,
            MAX_DIMENSION
          )
        );
      } else {
        resolve();
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(FileValidationError.loadFailed());
    };

    img.src = url;
  });
}

/**
 * Validate uploaded file meets requirements
 */
async function validateFile(file: File): Promise<void> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw FileValidationError.fileTooLarge(file.size, MAX_FILE_SIZE);
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw FileValidationError.invalidFileType(file.type);
  }

  // Check image dimensions
  await validateImageDimensions(file);
}

/**
 * Image upload button component with validation and drag-and-drop support
 * Memoized to prevent re-renders when props unchanged
 */
function ImageUploaderComponent({ onFileChange, onError }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Validate file before passing to parent
      await validateFile(file);
      
      // If validation passes, call parent handler
      onFileChange(e);
    } catch (error) {
      // Clear the input so the same file can be selected again
      e.target.value = '';
      
      // Report validation error to parent
      if (onError && error instanceof FileValidationError) {
        onError(error);
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if leaving the drop zone entirely
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    try {
      // Validate file
      await validateFile(file);
      
      // Create a synthetic change event to reuse existing logic
      if (inputRef.current) {
        // Create a DataTransfer object to simulate file input
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        inputRef.current.files = dataTransfer.files;
        
        // Trigger the change event
        const event = new Event('change', { bubbles: true });
        inputRef.current.dispatchEvent(event);
      }
    } catch (error) {
      // Report validation error to parent
      if (onError && error instanceof FileValidationError) {
        onError(error);
      }
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        position: 'relative',
        border: isDragging ? '2px dashed var(--accent)' : '2px dashed transparent',
        borderRadius: '4px',
        padding: isDragging ? '8px' : '10px',
        backgroundColor: isDragging ? 'rgba(249, 115, 22, 0.08)' : 'transparent',
        transition: 'all 150ms ease',
      }}
    >
      <input
        ref={inputRef}
        accept="image/jpeg,image/jpg,image/png"
        style={{ display: 'none' }}
        id="file-upload"
        type="file"
        onChange={handleFileChange}
        aria-label="Upload image file (JPG or PNG, max 10 MB)"
      />
      <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
        <Button
          variant="contained"
          component="span"
          startIcon={<FileUploadIcon />}
          fullWidth
          aria-label="Choose image file to upload or drag and drop"
          sx={{
            pointerEvents: 'none', // Let label handle the click
          }}
        >
          {isDragging ? 'Drop image here' : 'Choose Image'}
        </Button>
      </label>
      {!isDragging && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: '8px', 
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          opacity: 0.7
        }}>
          or drag and drop
        </div>
      )}
    </div>
  );
}

export const ImageUploader = React.memo(ImageUploaderComponent);
