import React, { useState, useEffect, useMemo, useRef } from 'react';
import { flags } from '@/flags/flags';
import { useAvatarRenderer } from '@/hooks/useAvatarRenderer';
import { useFlagImageCache } from '@/hooks/useFlagImageCache';
import { useStepNavigation } from '@/hooks/useStepNavigation';
import { useDebounce } from '@/hooks/usePerformance';
import { getAssetUrl, config } from '@/config';
import { FlagSelector } from '@/components/FlagSelector';
import { FlagPreview } from '@/components/FlagPreview';
import { ImageUploadZone } from '@/components/ImageUploadZone';
import { Link } from 'react-router-dom';
import { AdjustStep } from '@/components/AdjustStep';
import { PrivacyModal } from '@/components/PrivacyModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { PresentationMode } from '@/components/PresentationModeSelector';
import type { ImagePosition, ImageDimensions, ImageAspectRatio, PositionLimits } from '@/utils/imagePosition';
import { calculatePositionLimits, getAspectRatio, clampPosition } from '@/utils/imagePosition';
import { captureAdjustedImage } from '@/utils/captureImage';
import { IMAGE_CONSTANTS, RENDER_SIZES } from '@/constants';
import '../styles.css';

/**
 * AppStepWorkflow - Main application component
 * 
 * Three-step workflow for creating profile picture with flag border:
 * 1. Upload image
 * 2. Select flag
 * 3. Adjust and download
 * 
 * Responsibilities:
 * - Orchestrate workflow state (image, flag, step)
 * - Coordinate rendering pipeline
 * - Render step-specific UI
 */
const STORAGE_KEY_IMAGE = 'beyond-borders-image';
const STORAGE_KEY_FLAG = 'beyond-borders-flag';

export function AppStepWorkflow() {
  // Restore state from sessionStorage on mount
  const [imageUrl, setImageUrl] = useState<string | null>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY_IMAGE);
      // If it's a data URL, use it directly; if it's a blob URL, it's invalid now
      return stored && stored.startsWith('data:') ? stored : null;
    } catch {
      return null;
    }
  });
  const [flagId, setFlagId] = useState<string | null>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY_FLAG);
      return stored ? stored : null;
    } catch {
      return null;
    }
  });
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  // Step 1: Image position and dimensions
  const [imagePosition, setImagePosition] = useState<ImagePosition>({ x: 0, y: 0, zoom: 0 });
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);
  const [circleSize, setCircleSize] = useState<number>(IMAGE_CONSTANTS.DEFAULT_CIRCLE_SIZE); // Default, will be updated from CSS
  
  // Step 1 → Step 3: Captured cropped image (Approach 2)
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  
  // Step 3: Adjust controls state
  const [thickness, setThickness] = useState(10);
  const [flagOffsetPct, setFlagOffsetPct] = useState(0); // Percentage: -50 to +50
  const [presentation, setPresentation] = useState<PresentationMode>('ring');
  const [segmentRotation, setSegmentRotation] = useState(0);
  
  // Track previous presentation mode to detect when switching to cutout
  const prevPresentationRef = useRef<PresentationMode>('ring');
  
  // Step navigation with URL sync
  const {
    currentStep,
    setCurrentStep,
    goToNext,
    goToPrevious,
    canGoToStep2,
    canGoToStep3,
  } = useStepNavigation({
    imageUrl,
    flagId,
  });
  
  // Avatar rendering
  const flagImageCache = useFlagImageCache();
  const { overlayUrl, isRendering, render } = useAvatarRenderer(flags, flagImageCache);
  
  // Memoize selected flag to prevent unnecessary re-renders
  const selectedFlag = useMemo(() => {
    return flagId ? flags.find(f => f.id === flagId) ?? null : null;
  }, [flagId]);

  // Calculate position limits based on image dimensions and zoom
  const positionLimits = useMemo<PositionLimits>(() => {
    if (!imageDimensions) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }
    return calculatePositionLimits(imageDimensions, circleSize, imagePosition.zoom);
  }, [imageDimensions, circleSize, imagePosition.zoom]);

  // Clamp position when image changes (not when zoom changes)
  // Position should remain constant when zoom changes - only clamp when new image is loaded
  // Note: When a new image is loaded, position is reset to { x: 0, y: 0, zoom: 0 } in the
  // image detection useEffect, so this clamping is mainly a safety check
  const prevImageDimensionsRef = useRef<ImageDimensions | null>(null);
  const positionRef = useRef<ImagePosition>(imagePosition);
  const limitsRef = useRef<PositionLimits>(positionLimits);
  
  // Keep refs in sync
  positionRef.current = imagePosition;
  limitsRef.current = positionLimits;
  
  useEffect(() => {
    if (imageDimensions && prevImageDimensionsRef.current) {
      // Only clamp if image dimensions changed (new image loaded)
      const imageChanged = 
        prevImageDimensionsRef.current.width !== imageDimensions.width ||
        prevImageDimensionsRef.current.height !== imageDimensions.height;
      
      if (imageChanged) {
        // New image loaded - clamp position to new limits (safety check)
        // Position is usually already reset to { x: 0, y: 0, zoom: 0 } by image detection useEffect
        const clamped = clampPosition(positionRef.current, limitsRef.current);
        // Only update if position was actually clamped
        if (clamped.x !== positionRef.current.x || clamped.y !== positionRef.current.y) {
          setImagePosition(clamped);
        }
      }
    }
    prevImageDimensionsRef.current = imageDimensions;
  }, [imageDimensions]); // Only depend on imageDimensions - position should remain constant when zoom changes

  // Get aspect ratio
  const aspectRatio = useMemo<ImageAspectRatio | null>(() => {
    return imageDimensions ? getAspectRatio(imageDimensions) : null;
  }, [imageDimensions]);

  // Detect image dimensions when image URL changes
  useEffect(() => {
    if (!imageUrl) {
      setImageDimensions(null);
      setImagePosition({ x: 0, y: 0, zoom: 0 });
      return;
    }

    const img = new Image();
    img.onload = () => {
      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      // Reset position when new image is loaded
      setImagePosition({ x: 0, y: 0, zoom: 0 });
    };
    img.onerror = () => {
      setImageDimensions(null);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Get circle size from CSS variable
  useEffect(() => {
    const updateCircleSize = () => {
      const wrapper = document.querySelector('.choose-wrapper');
      if (wrapper) {
        const computed = window.getComputedStyle(wrapper);
        const size = parseFloat(computed.width);
        if (!isNaN(size)) {
          // Circle is 80% of wrapper (inset 10% on each side)
          setCircleSize(size * 0.8);
        }
      }
    };
    
    updateCircleSize();
    window.addEventListener('resize', updateCircleSize);
    return () => window.removeEventListener('resize', updateCircleSize);
  }, [imageUrl]); // Re-run when image changes to ensure element exists

  // Track previous flag ID to detect flag changes
  const prevFlagIdRef = useRef<string | null>(flagId);
  
  // Set default offset when flag changes, when switching to cutout mode, or when entering Step 3
  useEffect(() => {
    if (currentStep === 3 && presentation === 'cutout') {
      const defaultOffset = selectedFlag?.modes?.cutout?.defaultOffset;
      const switchedToCutout = prevPresentationRef.current !== 'cutout';
      const flagChanged = prevFlagIdRef.current !== flagId;
      
      // Set default when switching to cutout mode or when flag changes in cutout mode
      if (switchedToCutout || flagChanged) {
        if (defaultOffset !== undefined) {
          // Use the percentage directly - no conversion needed
          setFlagOffsetPct(defaultOffset);
        } else {
          // If in cutout mode but flag doesn't have cutout config, reset to 0
          setFlagOffsetPct(0);
        }
      }
    }
    
    // Update refs for next render
    prevPresentationRef.current = presentation;
    prevFlagIdRef.current = flagId;
  }, [currentStep, flagId, presentation, selectedFlag?.modes?.cutout?.defaultOffset]);

  // Preload full flag image when flag is selected (needed for cutout mode)
  useEffect(() => {
    if (!selectedFlag?.png_full) return;

    const cacheKey = selectedFlag.png_full;
    
    // Skip if already cached
    if (flagImageCache.has(cacheKey)) return;

    // Preload the full flag image asynchronously
    const preloadFlag = async () => {
      try {
        const response = await fetch(getAssetUrl(`flags/${selectedFlag.png_full}`));
        if (!response.ok) return;
        
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        flagImageCache.set(cacheKey, bitmap);
      } catch {
        // Silent fail - preloading is best-effort
        // Errors are handled silently to avoid user-facing noise
      }
    };

    void preloadFlag();
  }, [selectedFlag?.png_full, flagImageCache]);

  // Debounce slider values for smoother rendering during drag
  const debouncedThickness = useDebounce(thickness, 50);
  const debouncedFlagOffsetPct = useDebounce(flagOffsetPct, 50);
  const debouncedSegmentRotation = useDebounce(segmentRotation, 50);

  // Track position when image was captured (for recapture detection)
  const capturedPositionRef = useRef<ImagePosition | null>(null);
  
  // Capture adjusted image when transitioning to Step 3 (Approach 2)
  useEffect(() => {
    if (currentStep === 3 && imageUrl && imageDimensions) {
      // Check if we need to capture (first time or position changed)
      const needsCapture = !croppedImageUrl || 
        !capturedPositionRef.current ||
        capturedPositionRef.current.x !== imagePosition.x ||
        capturedPositionRef.current.y !== imagePosition.y ||
        capturedPositionRef.current.zoom !== imagePosition.zoom;
      
      if (needsCapture) {
        // Capture the adjusted image at final render size (high-res for quality)
        captureAdjustedImage(
          imageUrl,
          imagePosition,
          circleSize,
          imageDimensions,
          IMAGE_CONSTANTS.DEFAULT_CAPTURE_SIZE
        )
          .then((captured) => {
            setCroppedImageUrl(captured);
            capturedPositionRef.current = { ...imagePosition };
          })
          .catch(() => {
            // Fallback: use original image if capture fails
            // Error is handled silently - user still gets a working image
            setCroppedImageUrl(imageUrl);
            capturedPositionRef.current = { ...imagePosition };
          });
      }
    }
    
    // Reset cropped image when going back to Step 1 or when image changes
    if (currentStep === 1 || !imageUrl) {
      setCroppedImageUrl(null);
      capturedPositionRef.current = null;
    }
  }, [currentStep, imageUrl, imageDimensions, imagePosition, circleSize, croppedImageUrl]);

  // Trigger render when parameters change (Step 3)
  useEffect(() => {
    if (currentStep === 3 && croppedImageUrl && flagId) {
      // Render at high-res (2x) for preview to ensure crisp quality when scaled down
      // The preview container is 250-400px, so high-res gives us 2.5-4x resolution
      // This eliminates blur from CSS downscaling
      // Use cropped image - no position/zoom needed (already captured)
      render(croppedImageUrl, flagId, {
        size: RENDER_SIZES.HIGH_RES,
        thickness: debouncedThickness,
        flagOffsetPct: debouncedFlagOffsetPct,
        presentation,
        segmentRotation: debouncedSegmentRotation,
        bg: 'transparent',
        // No imagePosition - the cropped image is already adjusted
      });
    }
  }, [currentStep, croppedImageUrl, flagId, debouncedThickness, debouncedFlagOffsetPct, presentation, debouncedSegmentRotation, render]);

  // Persist imageUrl to sessionStorage
  useEffect(() => {
    try {
      if (imageUrl) {
        sessionStorage.setItem(STORAGE_KEY_IMAGE, imageUrl);
      } else {
        sessionStorage.removeItem(STORAGE_KEY_IMAGE);
      }
    } catch {
      // Ignore storage errors (e.g., private browsing)
    }
  }, [imageUrl]);

  // Persist flagId to sessionStorage
  useEffect(() => {
    try {
      if (flagId) {
        sessionStorage.setItem(STORAGE_KEY_FLAG, flagId);
      } else {
        sessionStorage.removeItem(STORAGE_KEY_FLAG);
      }
    } catch {
      // Ignore storage errors (e.g., private browsing)
    }
  }, [flagId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Convert file to data URL for persistence across navigation
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setImageUrl(dataUrl);
    };
    reader.onerror = () => {
      // Fallback to blob URL if data URL conversion fails
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    };
    reader.readAsDataURL(file);
  };
  
  const handleDownload = () => {
    if (!overlayUrl) return;
    const a = document.createElement('a');
    a.href = overlayUrl;
    // Generate identifier: timestamp for uniqueness
    const identifier = Date.now();
    a.download = `wearebeyondborders-dot-com-${identifier}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleStartOver = () => {
    setImageUrl(null);
    setFlagId(null);
    setCroppedImageUrl(null);
    setCurrentStep(1);
    setThickness(10);
    setFlagOffsetPct(0);
    setPresentation('ring');
    setSegmentRotation(0);
    try {
      sessionStorage.removeItem(STORAGE_KEY_IMAGE);
      sessionStorage.removeItem(STORAGE_KEY_FLAG);
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <>
      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="visually-hidden">
        Step {currentStep} of 3
      </div>

      {/* Main Canvas Container */}
      <main className="canvas" role="presentation" aria-label="Beyond Borders Application">
        {/* Header */}
        <header className="app-header">
          <h1 className="app-title">Beyond Borders</h1>
          <p className="app-subtitle">Add a flag border to your profile picture</p>
        </header>

        {/* Content Wrapper */}
        <div className="content-wrapper">
          {/* Background */}
          <div className="content-bg" aria-hidden="true"></div>

          {/* Progress indicators */}
          <div className="progress-row">
            <div className={`progress ${currentStep > 1 ? 'completed' : currentStep === 1 ? 'active' : 'upcoming'}`}>
              <span><span className="progress-number">1/</span>IMAGE</span>
            </div>
            <div className={`progress ${currentStep > 2 ? 'completed' : currentStep === 2 ? 'active' : 'upcoming'}`}>
              <span><span className="progress-number">2/</span>FLAG</span>
            </div>
            <div className={`progress ${currentStep > 3 ? 'completed' : currentStep === 3 ? 'active' : 'upcoming'}`}>
              <span><span className="progress-number">3/</span>ADJUST</span>
            </div>
          </div>

          {/* Content Area */}
          <div className="content-area">
            {/* Step 1: Image Upload */}
            {currentStep === 1 && (
              <ErrorBoundary
                fallback={
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <h3>Error loading image upload</h3>
                    <p>Please refresh the page and try again.</p>
                  </div>
                }
              >
                <ImageUploadZone
                  imageUrl={imageUrl}
                  onImageUpload={handleImageUpload}
                  onShowPrivacy={() => setShowPrivacyModal(true)}
                  position={imagePosition}
                  limits={positionLimits}
                  aspectRatio={aspectRatio}
                  imageDimensions={imageDimensions}
                  onPositionChange={setImagePosition}
                  circleSize={circleSize}
                />
              </ErrorBoundary>
            )}

            {/* Step 2: Flag Selection */}
            {currentStep === 2 && (
              <ErrorBoundary
                fallback={
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <h3>Error loading flag selector</h3>
                    <p>Please refresh the page and try again.</p>
                  </div>
                }
              >
                <div className="flag-selector-wrapper">
                  <FlagSelector
                    flags={flags}
                    selectedFlagId={flagId}
                    onFlagChange={setFlagId}
                  />
                  <FlagPreview flag={selectedFlag} />
                </div>
              </ErrorBoundary>
            )}

            {/* Step 3: Adjust */}
            {currentStep === 3 && (
              <ErrorBoundary
                fallback={
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <h3>Error loading adjustment controls</h3>
                    <p>Please go back and try again, or refresh the page.</p>
                  </div>
                }
              >
                <AdjustStep
                  overlayUrl={overlayUrl}
                  isRendering={isRendering}
                  selectedFlag={selectedFlag}
                  presentation={presentation}
                  onPresentationChange={setPresentation}
                  thickness={thickness}
                  onThicknessChange={setThickness}
                  flagOffsetPct={flagOffsetPct}
                  onFlagOffsetChange={setFlagOffsetPct}
                  segmentRotation={segmentRotation}
                  onSegmentRotationChange={setSegmentRotation}
                />
              </ErrorBoundary>
            )}
          </div>

          {/* Navigation Section */}
          <div className="nav-section">
            {currentStep === 1 && (
              <button
                type="button"
                className="nav-btn"
                onClick={goToNext}
                disabled={!canGoToStep2}
                aria-label="Go to next step"
              >
                <span>NEXT →</span>
              </button>
            )}
            
            {currentStep === 2 && (
              <div className="step-3-nav">
                <div className="nav-buttons-row">
                  <button
                    type="button"
                    className="nav-btn"
                    onClick={goToPrevious}
                    aria-label="Go to previous step"
                  >
                    <span>← BACK</span>
                  </button>
                  <button
                    type="button"
                    className="nav-btn"
                    onClick={goToNext}
                    disabled={!canGoToStep3}
                    aria-label="Go to next step"
                  >
                    <span>NEXT →</span>
                  </button>
                </div>
                <button
                  type="button"
                  className="start-over-btn"
                  onClick={handleStartOver}
                  aria-label="Start over with a new image"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 3v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Start Over
                </button>
              </div>
            )}
            
            {currentStep === 3 && (
              <div className="step-3-nav">
                <div className="nav-buttons-row">
                  <button
                    type="button"
                    className="nav-btn"
                    onClick={goToPrevious}
                    aria-label="Go to previous step"
                  >
                    <span>← BACK</span>
                  </button>
                  <button
                    type="button"
                    className="nav-btn"
                    onClick={handleDownload}
                    disabled={!overlayUrl || isRendering}
                    aria-label="Save avatar"
                  >
                    <span>SAVE</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ marginLeft: '6px', position: 'relative', zIndex: 1 }}>
                      <path d="M8 2L8 10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L2 13C2 13.5523 2.44772 14 3 14L13 14C13.5523 14 14 13.5523 14 13L14 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M3 10L3 12L13 12L13 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                <button
                  type="button"
                  className="start-over-btn"
                  onClick={handleStartOver}
                  aria-label="Start over with a new image"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 3v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Start Over
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-line1">
            <Link
              to="/ethics"
              className="footer-link"
              aria-label="Learn about ethics and sustainability"
            >
              Ethics and Sustainability
            </Link>
            {' | '}
            <a
              href="https://github.com/ravendarque/ravendarque-beyond-borders"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
              aria-label="View source code on GitHub"
            >
              GitHub Open Source
            </a>
          </div>
          <div className="footer-line2">
            <Link to="/copyright" className="footer-link" aria-label="View copyright information">
              © Nix Crabtree, 2025
            </Link>
          </div>
          <div className="footer-line3">
            <a
              href={`https://github.com/ravendarque/ravendarque-beyond-borders/releases/tag/v${config.getVersion()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-version"
              aria-label={`Version ${config.getVersion()} - View release on GitHub`}
            >
              v{config.getVersion()}
            </a>
          </div>
        </footer>
      </main>

      {/* Privacy Information Modal */}
      <PrivacyModal
        open={showPrivacyModal}
        onOpenChange={setShowPrivacyModal}
      />
    </>
  );
}
