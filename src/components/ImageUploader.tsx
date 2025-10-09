import React from 'react';
import Button from '@mui/material/Button';
import FileUploadIcon from '@mui/icons-material/UploadFile';

export interface ImageUploaderProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Image upload button component
 */
export function ImageUploader({ onFileChange }: ImageUploaderProps) {
  return (
    <>
      <input
        accept="image/*"
        style={{ display: 'none' }}
        id="file-upload"
        type="file"
        onChange={onFileChange}
      />
      <label htmlFor="file-upload">
        <Button
          variant="contained"
          component="span"
          startIcon={<FileUploadIcon />}
          fullWidth
        >
          Choose Image
        </Button>
      </label>
    </>
  );
}
