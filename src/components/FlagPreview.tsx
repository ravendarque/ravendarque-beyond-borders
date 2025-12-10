import React, { useState, useEffect, useRef } from 'react';
import type { FlagSpec } from '@/flags/schema';
import { getAssetUrl } from '@/config';
import { FlagDetailsModal } from './FlagDetailsModal';

export interface FlagPreviewProps {
  /** Selected flag to display */
  flag: FlagSpec | null;
}

/**
 * FlagPreview - Displays a flag image with correct aspect ratio
 * 
 * Single Responsibility: Display flag preview image
 */
export function FlagPreview({ flag }: FlagPreviewProps) {
  const flagId = flag?.id ?? null;
  const imageSrc = flag ? (flag.png_preview || flag.png_full) : null;
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Force reload image when flag changes by clearing and resetting src
  useEffect(() => {
    if (imageSrc && flagId) {
      const baseUrl = getAssetUrl(`flags/${imageSrc}`);
      // Clear the image first to force browser to discard cache
      if (imgRef.current) {
        imgRef.current.src = '';
        imgRef.current.removeAttribute('src');
      }
      // Use a small delay to ensure browser clears cache, then set new URL with cache-busting
      const timeout = setTimeout(() => {
        // Include both flagId and timestamp in cache-bust to ensure unique URL
        setImageUrl(`${baseUrl}?v=${flagId}-${Date.now()}`);
      }, 10);
      return () => clearTimeout(timeout);
    } else {
      setImageUrl(null);
    }
  }, [imageSrc, flagId]);

  if (!flag) {
    return (
      <div className="flag-preview flag-preview-empty">
        <div className="icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 2399.5 2304" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(-.26504)">
              <path d="m336.02 1345.9c-184.43-526.94-335.52-959.07-335.75-960.29-0.3893-2.01 102.58-49.62 107.31-49.61 0.96168 0.001 743.15 1889.5 744.16 1894.5 0.3655 1.8202-174.51 73.476-179.32 73.476-0.59033 0-151.97-431.14-336.4-958.09z" fill="currentColor"/>
              <path d="m479.51 1092.4c-221.54-563.11-287.62-732.01-286.84-733.27 7.91-12.81 103.37-85.21 156.28-118.55 226.19-142.47 522.48-212.74 817.05-193.76l10.476 0.67518 237.44 534.25c130.59 293.84 237.59 534.1 237.77 533.92 0.1795-0.1795-52.581-196.04-117.25-435.25-64.665-239.21-117.8-436.29-118.09-437.96l-0.516-3.0317 17.345-3.7869c222.72-48.624 369.79-113.98 489.63-217.57 7.5438-6.5212 15.038-13.257 16.653-14.968 1.7-1.7002 3.5-3.1 4.1-3.1 1.0301 0 455.19 1145.4 456.25 1150.7 0.7419 3.6924-13.803 26.955-29.267 46.807-137.48 176.49-482.03 362.83-734.1 397-156.36 21.198-262.46-15.13-311.29-106.58-6.8919-12.907-7.3571-11.514 9.2052-27.574 83.584-81.054 212.39-148.52 266.24-139.44 49.089 8.2692 39.627 66.512-28.664 176.44l-6.9354 11.164 5.7665-6.1213c212.42-225.49 188.76-339.31-50.521-242.99-248.98 100.22-584.66 349.95-741.13 551.36-5.6613 7.2875-10.616 13.25-11.01 13.25-0.39424 0-130.25-329.23-288.57-731.62z" fill="currentColor" fillOpacity="0.8"/>
            </g>
          </svg>
        </div>
        <div className="prompt">Choose a flag to see preview</div>
      </div>
    );
  }

  if (!imageUrl || !flag) {
    return (
      <div className="flag-preview">
        <div className="flag-preview-placeholder">No preview available</div>
      </div>
    );
  }

  const aspectRatio = flag.aspectRatio ?? 2; // Default to 2:1 if not specified

  return (
    <>
      <div className="flag-preview-wrapper">
        <div 
          className="flag-preview"
          style={{ aspectRatio: `${aspectRatio} / 1` }}
        >
          <img 
            ref={imgRef}
            src={imageUrl}
            alt={flag.displayName}
            className="flag-preview-image"
            loading="eager"
            key={`${flagId}-${imageUrl}`}
          />
        </div>
        <button
          className="flag-about-link"
          onClick={() => setShowDetailsModal(true)}
          type="button"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          About this flag
        </button>
      </div>
      <FlagDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        flag={flag}
      />
    </>
  );
}
