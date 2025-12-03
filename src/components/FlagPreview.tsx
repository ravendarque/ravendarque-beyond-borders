import React from 'react';
import type { FlagSpec } from '@/flags/schema';
import { getAssetUrl } from '@/config';

export interface FlagPreviewProps {
  /** Selected flag to display */
  flag: FlagSpec | null;
  /** Size variant */
  size?: 'small' | 'large';
}

/**
 * FlagPreview - Displays a flag image with correct aspect ratio
 * 
 * Single Responsibility: Display flag preview image
 */
export function FlagPreview({ flag, size = 'large' }: FlagPreviewProps) {
  if (!flag) {
    return (
      <div className="flag-preview flag-preview-empty">
        <div className="icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="18" height="12" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="3" y1="16" x2="21" y2="16" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </div>
        <div className="prompt">Choose a flag to see preview</div>
      </div>
    );
  }

  const imageSrc = flag.png_preview || flag.png_full;
  
  if (!imageSrc) {
    return (
      <div className="flag-preview">
        <div className="flag-preview-placeholder">No preview available</div>
      </div>
    );
  }

  return (
    <div className="flag-preview">
      <img 
        src={getAssetUrl(`flags/${imageSrc}`)}
        alt={flag.displayName}
        className="flag-preview-image"
      />
    </div>
  );
}

