import React, { useRef, useEffect } from 'react';
import * as Slider from '@radix-ui/react-slider';
import type { ImagePosition, PositionLimits, ImageAspectRatio, ImageDimensions } from '@/utils/imagePosition';
import { useImageDrag } from '@/hooks/useImageDrag';
import { positionToBackgroundPosition } from '@/utils/imagePosition';

export interface ImageUploadZoneProps {
  /** Current uploaded image URL */
  imageUrl: string | null;
  /** Callback when image is uploaded */
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Callback to show privacy modal */
  onShowPrivacy: () => void;
  /** Current image position */
  position: ImagePosition;
  /** Position limits based on aspect ratio */
  limits: PositionLimits;
  /** Image aspect ratio */
  aspectRatio: ImageAspectRatio | null;
  /** Image dimensions */
  imageDimensions: ImageDimensions | null;
  /** Callback when position changes */
  onPositionChange: (position: ImagePosition) => void;
  /** Circle size in pixels */
  circleSize: number;
}

/**
 * ImageUploadZone - File upload UI for selecting profile picture
 * 
 * Single Responsibility: Image file selection, preview, and position adjustment
 */
export function ImageUploadZone({
  imageUrl,
  onImageUpload,
  onShowPrivacy,
  position,
  limits,
  aspectRatio,
  imageDimensions,
  onPositionChange,
  circleSize,
}: ImageUploadZoneProps) {
  const labelRef = useRef<HTMLLabelElement>(null);
  const wasDraggingRef = useRef(false);
  
  // Use drag hook for panning
  const { dragHandlers, setElementRef, isDragging } = useImageDrag({
    position,
    limits,
    onPositionChange,
    enabled: !!imageUrl,
  });
  
  // Track if we were dragging to prevent click after drag
  useEffect(() => {
    if (isDragging) {
      wasDraggingRef.current = true;
    } else if (wasDraggingRef.current) {
      // Reset flag after drag ends (with small delay to catch click event)
      const timeout = setTimeout(() => {
        wasDraggingRef.current = false;
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [isDragging]);
  
  // Calculate CSS values for background-image display
  const backgroundStyle = imageUrl ? {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: positionToBackgroundPosition({ x: position.x, y: position.y }),
    backgroundRepeat: 'no-repeat',
  } : undefined;
  
  // Determine which controls are enabled based on whether movement is possible
  const EPSILON = 0.001;
  const horizontalEnabled = Math.abs(limits.maxX - limits.minX) > EPSILON;
  const verticalEnabled = Math.abs(limits.maxY - limits.minY) > EPSILON;
  
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
          ref={(el) => {
            labelRef.current = el;
            setElementRef(el);
          }}
          htmlFor="step1-file-upload"
          className={imageUrl ? "choose-circle has-image" : "choose-circle"}
          role="button"
          aria-label="Choose your profile picture"
          style={backgroundStyle}
          {...dragHandlers}
          onClick={(e) => {
            // Prevent file dialog only if we were dragging
            // This allows clicking to choose a new image when an image is already selected
            if (wasDraggingRef.current) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          {!imageUrl && (
            <>
              <div className="icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="4" fill="currentColor"/>
                  <path d="M6 20C6 16 8.5 14 12 14C15.5 14 18 16 18 20" fill="currentColor"/>
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

      {/* Position Controls - Only show when image is uploaded */}
      {imageUrl && (
        <div className="adjust-controls step1-controls">
          {/* Horizontal Position Slider */}
          <div className="control-group">
            <div className="slider-container">
              <div className="slider-labels-row">
                <span className="slider-end-label">Left</span>
                <span className="slider-value">{Math.round(position.x)}%</span>
                <span className="slider-end-label">Right</span>
              </div>
              <div className="slider-with-icons">
                <span className="slider-icon" aria-label="Move left">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <Slider.Root
                  className="slider-root"
                  value={[-position.x]} // Invert: slider right = negative position = show right side
                  onValueChange={([value]) => {
                    const invertedValue = -value;
                    const clampedX = Math.max(limits.minX, Math.min(limits.maxX, invertedValue));
                    onPositionChange({ ...position, x: clampedX });
                  }}
                  min={limits.minX === limits.maxX ? -100 : -limits.maxX}
                  max={limits.minX === limits.maxX ? 100 : -limits.minX}
                  step={1}
                  disabled={!horizontalEnabled}
                  aria-label="Horizontal position"
                >
                  <Slider.Track className="slider-track">
                    <Slider.Range className="slider-range" />
                  </Slider.Track>
                  <Slider.Thumb className="slider-thumb" />
                </Slider.Root>
                <span className="slider-icon" aria-label="Move right">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>

          {/* Vertical Position Slider */}
          <div className="control-group">
            <div className="slider-container">
              <div className="slider-labels-row">
                <span className="slider-end-label">Down</span>
                <span className="slider-value">{Math.round(position.y)}%</span>
                <span className="slider-end-label">Up</span>
              </div>
              <div className="slider-with-icons">
                <span className="slider-icon" aria-label="Move down">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <Slider.Root
                  className="slider-root"
                  value={[position.y]}
                  onValueChange={([value]) => {
                    const clampedY = Math.max(limits.minY, Math.min(limits.maxY, value));
                    onPositionChange({ ...position, y: clampedY });
                  }}
                  min={limits.minY === limits.maxY ? -100 : limits.minY}
                  max={limits.minY === limits.maxY ? 100 : limits.maxY}
                  step={1}
                  disabled={!verticalEnabled}
                  aria-label="Vertical position"
                >
                  <Slider.Track className="slider-track">
                    <Slider.Range className="slider-range" />
                  </Slider.Track>
                  <Slider.Thumb className="slider-thumb" />
                </Slider.Root>
                <span className="slider-icon" aria-label="Move up">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

