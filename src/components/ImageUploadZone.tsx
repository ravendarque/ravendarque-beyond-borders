import React from 'react';

export interface ImageUploadZoneProps {
  /** Current uploaded image URL */
  imageUrl: string | null;
  /** Callback when image is uploaded */
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Callback to show privacy modal */
  onShowPrivacy: () => void;
}

/**
 * ImageUploadZone - File upload UI for selecting profile picture
 * 
 * Single Responsibility: Image file selection and preview
 */
export function ImageUploadZone({ imageUrl, onImageUpload, onShowPrivacy }: ImageUploadZoneProps) {
  return (
    <>
      <input
        type="file"
        id="step1-file-upload"
        accept="image/jpeg,image/jpg,image/png"
        style={{ display: 'none' }}
        onChange={onImageUpload}
        aria-label="Choose image file (JPG or PNG)"
      />
      
      <div className="choose-wrapper">
        <label
          htmlFor="step1-file-upload"
          className={imageUrl ? "choose-circle has-image" : "choose-circle"}
          role="button"
          aria-label="Choose your profile picture"
          style={imageUrl ? {
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : undefined}
        >
          {!imageUrl && (
            <>
              <div className="icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M6 20C6 16 8.5 14 12 14C15.5 14 18 16 18 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="prompt">Choose your profile picture</div>
              <div className="formats">JPG or PNG</div>
              <button
                type="button"
                className="privacy"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onShowPrivacy();
                }}
                aria-label="Learn about privacy: Stays on your device"
              >
                <span className="info" aria-hidden="true">i</span>
                Stays on your device
              </button>
            </>
          )}
        </label>
      </div>
    </>
  );
}

