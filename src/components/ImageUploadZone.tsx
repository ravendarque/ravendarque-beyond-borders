import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import * as Slider from '@radix-ui/react-slider';
import type { ImagePosition, PositionLimits, ImageAspectRatio, ImageDimensions } from '@/utils/imagePosition';
import { useImageDrag } from '@/hooks/useImageDrag';
import { positionToBackgroundPosition, calculateBackgroundSize, calculatePositionLimits } from '@/utils/imagePosition';

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
  aspectRatio: _aspectRatio,
  imageDimensions,
  onPositionChange,
  circleSize,
}: ImageUploadZoneProps) {
  const labelRef = useRef<HTMLLabelElement | null>(null);
  const wasDraggingRef = useRef(false);
  const pinchStartRef = useRef<{ distance: number; zoom: number } | null>(null);
  
  // Use drag hook for panning
  const { dragHandlers, setElementRef, isDragging } = useImageDrag({
    position,
    limits,
    onPositionChange,
    enabled: !!imageUrl,
  });

  // Handle scroll wheel for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!imageUrl) return;
    
    // Only handle zoom if not dragging
    if (isDragging) return;
    
    e.preventDefault();
    
    // Scroll down = zoom out, scroll up = zoom in
    // Use deltaY: positive = scroll down, negative = scroll up
    const zoomDelta = -e.deltaY * 0.5; // Scale down the sensitivity
    const newZoom = Math.max(0, Math.min(200, position.zoom + zoomDelta));
    
    // Update zoom and clamp position to new limits
    const newPosition = { ...position, zoom: newZoom };
    // Recalculate limits would happen in parent, but we need to clamp here
    // For now, just update zoom - parent will handle clamping via limits
    onPositionChange(newPosition);
  }, [imageUrl, isDragging, position, onPositionChange]);

  // Handle pinch gesture for zoom (touch devices)
  const getTouchDistance = useCallback((touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Combined touch handlers that handle both pinch and drag
  const combinedTouchStart = useCallback((e: React.TouchEvent) => {
    if (!imageUrl) return;
    
    // If two touches, start pinch gesture (prevent drag)
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches as unknown as TouchList);
      pinchStartRef.current = { distance, zoom: position.zoom };
      e.preventDefault(); // Prevent default to avoid scrolling
      e.stopPropagation(); // Prevent drag handler from running
    } else {
      // Single touch - clear pinch state and let drag handler handle it
      pinchStartRef.current = null;
      // Call the drag handler for single touches
      dragHandlers.onTouchStart?.(e);
    }
  }, [imageUrl, position.zoom, getTouchDistance, dragHandlers]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!imageUrl) return;
    
    // If pinching (two touches), handle zoom
    if (e.touches.length === 2 && pinchStartRef.current) {
      e.preventDefault();
      e.stopPropagation(); // Prevent drag handler from running
      
      const currentDistance = getTouchDistance(e.touches as unknown as TouchList);
      const startDistance = pinchStartRef.current.distance;
      const startZoom = pinchStartRef.current.zoom;
      
      // Calculate zoom change based on distance change
      const distanceRatio = currentDistance / startDistance;
      // Scale the ratio to zoom percentage (1.0 = no change, 1.5 = 50% more zoom)
      const zoomChange = (distanceRatio - 1) * 100;
      const newZoom = Math.max(0, Math.min(200, startZoom + zoomChange));
      
      const newPosition = { ...position, zoom: newZoom };
      onPositionChange(newPosition);
    } else if (e.touches.length === 1) {
      // Single touch - clear pinch state (drag will handle it)
      pinchStartRef.current = null;
    }
  }, [imageUrl, position, onPositionChange, getTouchDistance]);

  const handleTouchEnd = useCallback(() => {
    pinchStartRef.current = null;
  }, []);
  
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
  
  // Calculate maximum limits (at zoom 200%) as reference for consistent position mapping
  // This ensures -50% always represents the same relative position regardless of current zoom
  const maxLimits = useMemo<PositionLimits>(() => {
    if (!imageDimensions) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }
    return calculatePositionLimits(imageDimensions, circleSize, 200);
  }, [imageDimensions, circleSize]);
  
  // Calculate CSS values for background-image display
  // Use calculateBackgroundSize to maintain cover behavior with zoom
  // Map position using maxLimits as reference, then scale to current limits for display
  const backgroundSize = calculateBackgroundSize(imageDimensions, circleSize, position.zoom);
  const backgroundStyle = imageUrl ? {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize,
    backgroundPosition: positionToBackgroundPosition({ x: position.x, y: position.y }, limits, maxLimits),
    backgroundRepeat: 'no-repeat',
  } : undefined;

  // Determine which controls are enabled based on whether movement is possible
  // When zoom > 0, both controls should be enabled
  const EPSILON = 0.001;
  const horizontalEnabled = position.zoom > 0 || Math.abs(limits.maxX - limits.minX) > EPSILON;
  const verticalEnabled = position.zoom > 0 || Math.abs(limits.maxY - limits.minY) > EPSILON;
  
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
            if (el) {
              labelRef.current = el;
            }
            setElementRef(el);
          }}
          htmlFor="step1-file-upload"
          className={imageUrl ? "choose-circle has-image" : "choose-circle"}
          role="button"
          aria-label="Choose your profile picture"
          style={backgroundStyle}
          onMouseDown={dragHandlers.onMouseDown}
          onWheel={handleWheel}
          onTouchStart={combinedTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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
                    // Position is stored as a fixed percentage (-50 to +50), independent of zoom
                    // Clamp to fixed range, not to limits
                    const clampedX = Math.max(-50, Math.min(50, invertedValue));
                    onPositionChange({ ...position, x: clampedX });
                  }}
                  min={-50}
                  max={50}
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
                <span className="slider-end-label">Up</span>
                <span className="slider-value">{Math.round(position.y)}%</span>
                <span className="slider-end-label">Down</span>
              </div>
              <div className="slider-with-icons">
                <span className="slider-icon" aria-label="Move up">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <Slider.Root
                  className="slider-root"
                  value={[-position.y]} // Invert: slider right = negative position = show bottom
                  onValueChange={([value]) => {
                    // Position is stored as a fixed percentage (-50 to +50), independent of zoom
                    // Clamp to fixed range, not to limits
                    // Invert back: slider value is inverted
                    const invertedValue = -value;
                    const clampedY = Math.max(-50, Math.min(50, invertedValue));
                    onPositionChange({ ...position, y: clampedY });
                  }}
                  min={-50}
                  max={50}
                  step={1}
                  disabled={!verticalEnabled}
                  aria-label="Vertical position"
                >
                  <Slider.Track className="slider-track">
                    <Slider.Range className="slider-range" />
                  </Slider.Track>
                  <Slider.Thumb className="slider-thumb" />
                </Slider.Root>
                <span className="slider-icon" aria-label="Move down">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>

          {/* Zoom Slider */}
          <div className="control-group">
            <div className="slider-container">
              <div className="slider-labels-row">
                <span className="slider-end-label">Zoom Out</span>
                <span className="slider-value">{Math.round(position.zoom)}%</span>
                <span className="slider-end-label">Zoom In</span>
              </div>
              <div className="slider-with-icons">
                <span className="slider-icon" aria-label="Zoom out">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                <Slider.Root
                  className="slider-root"
                  value={[position.zoom]}
                  onValueChange={([value]) => {
                    const clampedZoom = Math.max(0, Math.min(200, value));
                    onPositionChange({ ...position, zoom: clampedZoom });
                  }}
                  min={0}
                  max={200}
                  step={1}
                  aria-label="Zoom level"
                >
                  <Slider.Track className="slider-track">
                    <Slider.Range className="slider-range" />
                  </Slider.Track>
                  <Slider.Thumb className="slider-thumb" />
                </Slider.Root>
                <span className="slider-icon" aria-label="Zoom in">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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

