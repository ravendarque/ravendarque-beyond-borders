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
 * Image upload button component with validation
 * Memoized to prevent re-renders when props unchanged
 */
function ImageUploaderComponent({ onFileChange, onError }: ImageUploaderProps) {
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

  return (
    <>
      <input
        accept="image/jpeg,image/jpg,image/png"
        style={{ display: 'none' }}
        id="file-upload"
        type="file"
        onChange={handleFileChange}
        aria-label="Upload image file (JPG or PNG, max 10 MB)"
      />
      <label htmlFor="file-upload">
        <Button
          variant="contained"
          component="span"
          startIcon={<FileUploadIcon />}
          fullWidth
          aria-label="Choose image file to upload"
        >
          Choose Image
        </Button>
      </label>
    </>
  );
}

export const ImageUploader = React.memo(ImageUploaderComponent);
