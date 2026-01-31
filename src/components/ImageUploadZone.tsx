import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import type { ImagePosition, PositionLimits, ImageAspectRatio, ImageDimensions } from '@/utils/imagePosition';
import { useImageDrag } from '@/hooks/useImageDrag';
import { positionToBackgroundPosition, calculateBackgroundSize, calculatePositionLimits } from '@/utils/imagePosition';
import type { FlagSpec } from '@/flags/schema';
import type { PresentationMode } from '@/components/PresentationModeSelector';
import { generateFlagPatternStyle } from '@/utils/flagPattern';

export interface ImageUploadZoneProps {
  /** Current uploaded image URL */
  imageUrl: string | null;
  /** Callback when image is uploaded */
  onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Callback to show privacy modal */
  onShowPrivacy?: () => void;
  /** Current image position */
  position: ImagePosition;
  /** Position limits based on aspect ratio */
  limits: PositionLimits;
  /** Image aspect ratio */
  aspectRatio: ImageAspectRatio | null;
  /** Image dimensions */
  imageDimensions: ImageDimensions | null;
  /** Callback when position changes */
  onPositionChange?: (position: ImagePosition) => void;
  /** Circle size in pixels (effective size, may be adjusted for border thickness) */
  circleSize: number;
  /** Base circle size in pixels (original size before border thickness adjustment) */
  baseCircleSize?: number;
  /** If true, component is readonly (no interactions) */
  readonly?: boolean;
  /** Flag specification (for Step 3 flag pattern) */
  flag?: FlagSpec | null;
  /** Presentation mode (for Step 3 flag pattern) */
  presentation?: PresentationMode;
  /** Border thickness percentage (for Step 3) */
  borderThicknessPct?: number;
  /** Flag offset percentage for cutout mode (for Step 3) */
  flagOffsetPct?: number;
  /** Segment rotation in degrees (for Step 3 segment mode) */
  segmentRotation?: number;
  /** If false, position/zoom sliders are not rendered (e.g. when rendered in layout controls slot) */
  renderPositionControls?: boolean;
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
  baseCircleSize,
  readonly = false,
  flag = null,
  presentation = 'ring',
  borderThicknessPct = 10,
  flagOffsetPct = 0,
  segmentRotation = 0,
  renderPositionControls = true,
}: ImageUploadZoneProps) {
  const labelRef = useRef<HTMLLabelElement | null>(null);
  const wasDraggingRef = useRef(false);
  const pinchStartRef = useRef<{ distance: number; zoom: number } | null>(null);
  
  // Use drag hook for panning (disabled in readonly mode)
  const { dragHandlers, setElementRef, isDragging } = useImageDrag({
    position,
    limits,
    onPositionChange: onPositionChange ?? (() => {}),
    enabled: !!imageUrl && !readonly && !!onPositionChange,
  });

  // Handle scroll wheel for zoom using native event listener for reliable preventDefault
  useEffect(() => {
    const element = labelRef.current;
    if (!element || !imageUrl || readonly) return;
    
    const handleWheel = (e: WheelEvent) => {
      // Only handle zoom if not dragging
      if (isDragging) return;
      
      // Prevent default scrolling to prevent page scroll
      e.preventDefault();
      e.stopPropagation();
      
      // Scroll down = zoom out, scroll up = zoom in
      // Use deltaY: positive = scroll down, negative = scroll up
      const zoomDelta = -e.deltaY * 0.1; // 10% per wheel notch
      const newZoom = Math.max(0, Math.min(200, position.zoom + zoomDelta));
      
      // Update zoom and clamp position to new limits
      const newPosition = { ...position, zoom: newZoom };
      // Recalculate limits would happen in parent, but we need to clamp here
      // For now, just update zoom - parent will handle clamping via limits
      if (onPositionChange) {
        onPositionChange(newPosition);
      }
    };
    
    // Use passive: false to allow preventDefault to work
    element.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      element.removeEventListener('wheel', handleWheel);
    };
  }, [imageUrl, isDragging, position, onPositionChange, readonly]);

  // Handle pinch gesture for zoom (touch devices)
  // Use native event listeners for reliable preventDefault in Firefox Android
  const getTouchDistance = useCallback((touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Use native event listeners for two-touch pinch gestures to properly prevent default in Firefox Android
  // Single-touch events still use React synthetic events for drag handler compatibility
  useEffect(() => {
    const element = labelRef.current;
    if (!element || !imageUrl) return;

    const handleTouchStart = (e: TouchEvent) => {
      // If two touches, start pinch gesture (prevent drag and browser zoom)
      if (e.touches.length === 2) {
        const distance = getTouchDistance(e.touches);
        pinchStartRef.current = { distance, zoom: position.zoom };
        // CRITICAL: Prevent default to stop browser zoom in Firefox Android
        e.preventDefault();
        e.stopPropagation();
      }
      // For single touch, let React synthetic event handler handle it (drag handler)
    };

    const handleTouchMove = (e: TouchEvent) => {
      // If pinching (two touches), handle zoom
      if (e.touches.length === 2 && pinchStartRef.current) {
        // CRITICAL: Prevent default to stop browser zoom in Firefox Android
        e.preventDefault();
        e.stopPropagation();
        
        const currentDistance = getTouchDistance(e.touches);
        const startDistance = pinchStartRef.current.distance;
        const startZoom = pinchStartRef.current.zoom;
        
        // Calculate zoom change based on distance change
        const distanceRatio = currentDistance / startDistance;
        // Scale the ratio to zoom percentage (1.0 = no change, 1.5 = 50% more zoom)
        const zoomChange = (distanceRatio - 1) * 100;
        const newZoom = Math.max(0, Math.min(200, startZoom + zoomChange));
        
        const newPosition = { ...position, zoom: newZoom };
        if (onPositionChange) {
          onPositionChange(newPosition);
        }
      } else if (e.touches.length === 1) {
        // Single touch - clear pinch state (drag will handle it)
        pinchStartRef.current = null;
      }
    };

    const handleTouchEnd = () => {
      pinchStartRef.current = null;
    };

    // Use passive: false to allow preventDefault to work
    // These listeners run before React's synthetic events, so we can prevent default for pinch
    element.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
    element.addEventListener('touchend', handleTouchEnd, { capture: true });
    element.addEventListener('touchcancel', handleTouchEnd, { capture: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart, { capture: true });
      element.removeEventListener('touchmove', handleTouchMove, { capture: true });
      element.removeEventListener('touchend', handleTouchEnd, { capture: true });
      element.removeEventListener('touchcancel', handleTouchEnd, { capture: true });
    };
  }, [imageUrl, position, onPositionChange, getTouchDistance]);

  // Combined touch handlers for single-touch drag (React synthetic events)
  const combinedTouchStart = useCallback((e: React.TouchEvent) => {
    if (!imageUrl) return;
    
    // If two touches, native listener already handled it
    if (e.touches.length === 2) {
      return;
    }
    
    // Single touch - clear pinch state and let drag handler handle it
    pinchStartRef.current = null;
    dragHandlers.onTouchStart?.(e);
  }, [imageUrl, dragHandlers]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!imageUrl) return;
    
    // If pinching (two touches), native listener already handled it
    if (e.touches.length === 2 && pinchStartRef.current) {
      return;
    }
    
    // Single touch - clear pinch state (drag will handle it)
    if (e.touches.length === 1) {
      pinchStartRef.current = null;
    }
  }, [imageUrl]);

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
  
  // Get wrapper size for flag pattern generation
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [wrapperSize, setWrapperSize] = useState<number | null>(null);
  
  useEffect(() => {
    if (!wrapperRef.current) return;
    
    const updateSize = () => {
      if (!wrapperRef.current) return;
      const computed = window.getComputedStyle(wrapperRef.current);
      const size = parseFloat(computed.width);
      if (!isNaN(size) && size > 0) {
        setWrapperSize(size);
      }
    };
    
    // Initial size - use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      updateSize();
      // Also try after a short delay in case CSS variables aren't ready
      setTimeout(updateSize, 100);
    });
    
    // Use ResizeObserver for more reliable size tracking
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    
    resizeObserver.observe(wrapperRef.current);
    
    // Fallback to window resize
    window.addEventListener('resize', updateSize);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);
  
  // Calculate circle inset based on border thickness (Step 3 only)
  // In Step 1, inset is fixed at 10% (from CSS)
  // In Step 3, inset = border thickness
  const circleInset = useMemo(() => {
    if (readonly && baseCircleSize && wrapperSize) {
      // Calculate border thickness in pixels
      const borderThicknessPx = (borderThicknessPct / 100) * wrapperSize;
      return `${borderThicknessPx}px`;
    }
    // Step 1: Use default CSS inset (10%)
    return undefined;
  }, [readonly, baseCircleSize, wrapperSize, borderThicknessPct]);
  
  // Generate flag pattern for wrapper background (Step 3 only)
  // Ring mode uses canvas rendering; segment/cutout use CSS gradients
  // Use double-buffering to prevent flicker: keep old pattern visible until new one is ready
  const [currentPatternStyle, setCurrentPatternStyle] = useState<React.CSSProperties | undefined>(undefined);
  const [nextPatternStyle, setNextPatternStyle] = useState<React.CSSProperties | undefined>(undefined);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isNextFadingIn, setIsNextFadingIn] = useState(false);
  const currentBlobUrlRef = useRef<string | null>(null);
  const nextBlobUrlRef = useRef<string | null>(null);
  const transitionTimeoutRef = useRef<number | null>(null);
  const effectIdRef = useRef<number>(0);
  
  useEffect(() => {
    if (!readonly || !flag || !wrapperSize) {
      setCurrentPatternStyle(undefined);
      setNextPatternStyle(undefined);
      setIsTransitioning(false);
      setIsNextFadingIn(false);
      return;
    }
    
    // Cancel any pending transitions from previous effect
    if (transitionTimeoutRef.current !== null) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    
    // Increment effect ID to track which effect is current
    const currentEffectId = ++effectIdRef.current;
    
    const borderThicknessPx = (borderThicknessPct / 100) * wrapperSize;
    const effectiveCircleSizeForPattern = wrapperSize - 2 * borderThicknessPx;
    
    // Generate new pattern in "next" buffer
    generateFlagPatternStyle({
      flag,
      presentation,
      thicknessPct: borderThicknessPct,
      flagOffsetPct,
      segmentRotation,
      wrapperSize,
      circleSize: effectiveCircleSizeForPattern,
    })
      .then((style) => {
        // Check if this effect is still current (not superseded by a newer one)
        if (currentEffectId !== effectIdRef.current) {
          // This effect is stale, clean up and abort
          const bgImage = style.backgroundImage;
          if (bgImage && bgImage.startsWith('url(')) {
            const urlMatch = bgImage.match(/url\(([^)]+)\)/);
            if (urlMatch && urlMatch[1].startsWith('blob:')) {
              URL.revokeObjectURL(urlMatch[1]);
            }
          }
          return;
        }
        
        // Extract and manage blob URL for cleanup (ring mode uses canvas -> blob URL)
        const bgImage = style.backgroundImage;
        let imageUrl: string | null = null;
        if (bgImage && bgImage.startsWith('url(')) {
          const urlMatch = bgImage.match(/url\(([^)]+)\)/);
          if (urlMatch && urlMatch[1].startsWith('blob:')) {
            // Store in next buffer
            if (nextBlobUrlRef.current) {
              URL.revokeObjectURL(nextBlobUrlRef.current);
            }
            nextBlobUrlRef.current = urlMatch[1];
            imageUrl = urlMatch[1];
          }
        }
        
        // Preload image if it's a blob URL to prevent flicker
        // For CSS gradients (segment mode), no preloading needed
        const startTransition = () => {
          // Check again if effect is still current
          if (currentEffectId !== effectIdRef.current) {
            if (imageUrl) {
              URL.revokeObjectURL(imageUrl);
            }
            return;
          }
          
          // Set next pattern first (hidden, opacity 0) - keep current visible
          setNextPatternStyle(style);
          setIsNextFadingIn(false);
          // Don't start fading out current yet - keep it fully visible
          
          // Wait for next frame to ensure DOM has updated and pattern is rendered
          requestAnimationFrame(() => {
            // Check again if effect is still current
            if (currentEffectId !== effectIdRef.current) {
              if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
              }
              return;
            }
            
            // Wait one more frame to ensure the element is fully painted
            requestAnimationFrame(() => {
              // Final check if effect is still current
              if (currentEffectId !== effectIdRef.current) {
                if (imageUrl) {
                  URL.revokeObjectURL(imageUrl);
                }
                return;
              }
              
              // Now both patterns are rendered - start cross-fade
              // Start fade-in of next pattern first
              setIsNextFadingIn(true);
              
              // Wait longer before starting fade-out to ensure next pattern is significantly visible
              // This prevents white flicker by keeping current pattern fully visible until next is well into its fade-in
              setTimeout(() => {
                if (currentEffectId !== effectIdRef.current) {
                  if (imageUrl) {
                    URL.revokeObjectURL(imageUrl);
                  }
                  return;
                }
                setIsTransitioning(true);
              }, 80); // Longer delay to let next pattern become more visible (about 30% of transition time)
              
              // After transition completes, swap buffers and clean up old pattern
              transitionTimeoutRef.current = window.setTimeout(() => {
                // Check one more time if effect is still current
                if (currentEffectId !== effectIdRef.current) {
                  if (imageUrl) {
                    URL.revokeObjectURL(imageUrl);
                  }
                  return;
                }
                
                // Clean up old current pattern
                if (currentBlobUrlRef.current) {
                  URL.revokeObjectURL(currentBlobUrlRef.current);
                }
                
                // Swap: next becomes current
                currentBlobUrlRef.current = nextBlobUrlRef.current;
                nextBlobUrlRef.current = null;
                
                setCurrentPatternStyle(style);
                setNextPatternStyle(undefined);
                setIsTransitioning(false);
                setIsNextFadingIn(false);
                transitionTimeoutRef.current = null;
              }, 350); // After fade transition completes (300ms + small buffer)
            });
          });
        };
        
        if (imageUrl) {
          const img = new Image();
          img.onload = () => {
            // Image is loaded, now safe to start transition
            startTransition();
          };
          img.onerror = () => {
            // If image fails to load, still start transition (fallback)
            startTransition();
          };
          img.src = imageUrl;
        } else {
          // For CSS gradients (segment/cutout), no preloading needed - start transition immediately
          startTransition();
        }
      })
      .catch(() => {
        // Only update state if this effect is still current
        if (currentEffectId === effectIdRef.current) {
          setNextPatternStyle(undefined);
          setIsTransitioning(false);
          setIsNextFadingIn(false);
        }
      });
    
    return () => {
      // Cancel pending timeout
      if (transitionTimeoutRef.current !== null) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
      
      // Only clean up blob URLs if this effect is being cleaned up (not a new one starting)
      // We'll let the new effect handle cleanup to prevent flicker
      // Capture effectId and ref value at cleanup time to avoid stale closure warning
      const cleanupEffectId = currentEffectId;
      const currentEffectIdAtCleanup = effectIdRef.current;
      if (cleanupEffectId === currentEffectIdAtCleanup) {
        if (nextBlobUrlRef.current) {
          URL.revokeObjectURL(nextBlobUrlRef.current);
          nextBlobUrlRef.current = null;
        }
      }
    };
  }, [readonly, flag, wrapperSize, presentation, borderThicknessPct, flagOffsetPct, segmentRotation]);
  
  // Calculate CSS values for background-image display
  // Use calculateBackgroundSize to maintain cover behavior with zoom
  // Map position using maxLimits as reference, then scale to current limits for display
  const backgroundSize = calculateBackgroundSize(imageDimensions, circleSize, position.zoom);
  const backgroundStyle = useMemo(() => {
    if (!imageUrl) return undefined;
    return {
      backgroundImage: `url(${imageUrl})`,
      backgroundSize,
      backgroundPosition: positionToBackgroundPosition({ x: position.x, y: position.y }, limits, maxLimits),
      backgroundRepeat: 'no-repeat' as const,
    };
  }, [imageUrl, backgroundSize, position.x, position.y, limits, maxLimits]);

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
      
      <div 
        ref={wrapperRef}
        className={readonly ? "choose-wrapper readonly" : "choose-wrapper"}
      >
        {/* Flag pattern layer (Step 3 only) - double-buffered for smooth transitions */}
        {readonly && currentPatternStyle && (
          <div
            className={`choose-wrapper-pattern choose-wrapper-pattern-current ${isTransitioning ? 'fading-out' : ''}`}
            style={currentPatternStyle}
          />
        )}
        {readonly && nextPatternStyle && (
          <div
            className={`choose-wrapper-pattern choose-wrapper-pattern-next ${isNextFadingIn ? 'fading-in' : ''}`}
            style={nextPatternStyle}
          />
        )}
        <label
          ref={(el) => {
            if (el) {
              labelRef.current = el;
            }
            setElementRef(el);
          }}
          htmlFor={readonly ? undefined : "step1-file-upload"}
          className={[
            "choose-circle",
            imageUrl && "has-image",
            isDragging && "is-dragging",
            readonly && "readonly"
          ].filter(Boolean).join(" ")}
          role={readonly ? "img" : "button"}
          aria-label={readonly ? "Profile picture preview" : "Choose your profile picture"}
          style={{
            ...backgroundStyle,
            ...(circleInset ? { inset: circleInset } : {}),
          }}
          onMouseDown={readonly ? undefined : dragHandlers.onMouseDown}
          onTouchStart={readonly ? undefined : combinedTouchStart}
          onTouchMove={readonly ? undefined : handleTouchMove}
          onTouchEnd={readonly ? undefined : handleTouchEnd}
          onClick={readonly ? undefined : (e) => {
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
                  if (onShowPrivacy) {
                    onShowPrivacy();
                  }
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

      {/* Position Controls - Only show when image is uploaded, not readonly, and not rendered in layout */}
      {imageUrl && !readonly && renderPositionControls && (
        <div className="adjust-controls step1-controls">
          {/* Horizontal Position Slider */}
          <div className="control-group">
            <div className="slider-container">
              <div className="slider-labels-row">
                <span className="slider-end-label">Move left</span>
                <span className="slider-value">{Math.round(position.x)}%</span>
                <span className="slider-end-label">Move right</span>
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
                    if (onPositionChange) {
                      onPositionChange({ ...position, x: clampedX });
                    }
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
                <span className="slider-end-label">Move up</span>
                <span className="slider-value">{Math.round(position.y)}%</span>
                <span className="slider-end-label">Move down</span>
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
                    if (onPositionChange) {
                      onPositionChange({ ...position, y: clampedY });
                    }
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
                    if (onPositionChange) {
                      onPositionChange({ ...position, zoom: clampedZoom });
                    }
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

