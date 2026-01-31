import React, { useEffect, useMemo, useState, useRef } from 'react';
import { flags } from '@/flags/flags';
import { useAvatarRenderer } from '@/hooks/useAvatarRenderer';
import { useFlagImageCache } from '@/hooks/useFlagImageCache';
import { useStepNavigation } from '@/hooks/useStepNavigation';
import { useWorkflowState } from '@/hooks/useWorkflowState';
import { useStepTransitions } from '@/hooks/useStepTransitions';
import { useDebounce } from '@/hooks/usePerformance';
import { getAssetUrl, config } from '@/config';
import { FlagSelector } from '@/components/FlagSelector';
import { FlagPreview } from '@/components/FlagPreview';
import { ImageUploadZone } from '@/components/ImageUploadZone';
import { Link } from 'react-router-dom';
import { PresentationModeSelector } from '@/components/PresentationModeSelector';
import { AdjustControls } from '@/components/AdjustControls';
import { StepLayout } from '@/components/StepLayout';
import { Step1PositionControls } from '@/components/Step1PositionControls';
import { PrivacyModal } from '@/components/PrivacyModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { ImageAspectRatio, PositionLimits } from '@/utils/imagePosition';
import { calculatePositionLimits, getAspectRatio } from '@/utils/imagePosition';
import { RENDER_SIZES } from '@/constants';
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

export function AppStepWorkflow() {
  // Unified workflow state management
  const workflow = useWorkflowState();
  const {
    step1,
    step2,
    step3,
    currentStep: workflowStep,
    setStep,
    setImageUrl,
    setImagePosition,
    setImageDimensions,
    setCircleSize,
    setFlagId,
    setThickness,
    setFlagOffsetPct,
    setPresentation,
    setSegmentRotation,
    resetAll,
    updateStep3ForFlag,
  } = workflow;

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Step navigation with URL sync (uses unified state)
  const {
    currentStep,
    setCurrentStep,
    goToNext,
    goToPrevious,
    canGoToStep2,
    canGoToStep3,
  } = useStepNavigation({
    imageUrl: step1.imageUrl,
    flagId: step2.flagId,
  });

  // Sync workflow step with navigation step (navigation is source of truth for URL sync)
  useEffect(() => {
    if (workflowStep !== currentStep) {
      setStep(currentStep);
    }
  }, [currentStep, workflowStep, setStep]);

  // Avatar rendering
  const flagImageCache = useFlagImageCache();
  const { overlayUrl, isRendering, render } = useAvatarRenderer(flags, flagImageCache);

  // Memoize selected flag to prevent unnecessary re-renders
  const selectedFlag = useMemo(() => {
    return step2.flagId ? flags.find(f => f.id === step2.flagId) ?? null : null;
  }, [step2.flagId]);

  // Step transitions (handles flag offset resets, dimension detection, etc.)
  useStepTransitions({
    state: workflow.state,
    selectedFlag,
    onImageDimensionsChange: setImageDimensions,
    onCircleSizeChange: setCircleSize,
    onFlagOffsetChange: setFlagOffsetPct,
    onUpdateStep3ForFlag: updateStep3ForFlag,
  });

  // Calculate position limits based on image dimensions and zoom
  // For Step 3, calculate effective circle size based on border thickness
  // The circle's visual size is controlled by inset, but we need effective size for position calculations
  const effectiveCircleSize = useMemo(() => {
    if (currentStep === 3 && step1.circleSize) {
      // Border thickness is a percentage of the wrapper size
      // We need to estimate wrapper size from circle size (circle is 80% of wrapper in Step 1)
      const estimatedWrapperSize = step1.circleSize / 0.8;
      const borderThicknessPx = (step3.thickness / 100) * estimatedWrapperSize;
      return Math.max(0, estimatedWrapperSize - 2 * borderThicknessPx);
    }
    return step1.circleSize;
  }, [currentStep, step1.circleSize, step3.thickness]);

  const positionLimits = useMemo<PositionLimits>(() => {
    if (!step1.imageDimensions) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }
    // Use effective circle size for Step 3, original circle size for Step 1
    const circleSizeForLimits = currentStep === 3 ? effectiveCircleSize : step1.circleSize;
    return calculatePositionLimits(step1.imageDimensions, circleSizeForLimits, step1.imagePosition.zoom);
  }, [step1.imageDimensions, step1.circleSize, effectiveCircleSize, step1.imagePosition.zoom, currentStep]);

  // Clamp position when limits change (zoom or dimensions change)
  // This ensures position is valid when zoom changes and axes become enabled/disabled
  const prevLimitsRef = useRef<PositionLimits | null>(null);
  useEffect(() => {
    if (!step1.imageDimensions || currentStep !== 1) {
      prevLimitsRef.current = null;
      return;
    }
    
    // Only clamp if limits actually changed (zoom changed)
    const limitsChanged = prevLimitsRef.current === null || 
      prevLimitsRef.current.minX !== positionLimits.minX ||
      prevLimitsRef.current.maxX !== positionLimits.maxX ||
      prevLimitsRef.current.minY !== positionLimits.minY ||
      prevLimitsRef.current.maxY !== positionLimits.maxY;
    
    if (!limitsChanged) {
      return;
    }
    
    prevLimitsRef.current = positionLimits;
    
    const EPSILON = 0.001;
    const horizontalDisabled = Math.abs(positionLimits.maxX - positionLimits.minX) < EPSILON;
    const verticalDisabled = Math.abs(positionLimits.maxY - positionLimits.minY) < EPSILON;
    
    // If an axis is disabled, reset that axis to 0
    // Otherwise, clamp to the new limits
    let needsUpdate = false;
    const newPosition = { ...step1.imagePosition };
    
    if (horizontalDisabled && Math.abs(newPosition.x) > EPSILON) {
      newPosition.x = 0;
      needsUpdate = true;
    } else if (!horizontalDisabled) {
      const clampedX = Math.max(positionLimits.minX, Math.min(positionLimits.maxX, newPosition.x));
      if (Math.abs(clampedX - newPosition.x) > EPSILON) {
        newPosition.x = clampedX;
        needsUpdate = true;
      }
    }
    
    if (verticalDisabled && Math.abs(newPosition.y) > EPSILON) {
      newPosition.y = 0;
      needsUpdate = true;
    } else if (!verticalDisabled) {
      const clampedY = Math.max(positionLimits.minY, Math.min(positionLimits.maxY, newPosition.y));
      if (Math.abs(clampedY - newPosition.y) > EPSILON) {
        newPosition.y = clampedY;
        needsUpdate = true;
      }
    }
    
    if (needsUpdate) {
      setImagePosition(newPosition);
    }
  }, [step1.imageDimensions, positionLimits, currentStep, setImagePosition, step1.imagePosition]);

  // Get aspect ratio
  const aspectRatio = useMemo<ImageAspectRatio | null>(() => {
    return step1.imageDimensions ? getAspectRatio(step1.imageDimensions) : null;
  }, [step1.imageDimensions]);

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
  const debouncedThickness = useDebounce(step3.thickness, 50);
  const debouncedFlagOffsetPct = useDebounce(step3.flagOffsetPct, 50);
  const debouncedSegmentRotation = useDebounce(step3.segmentRotation, 50);

  // Trigger render when parameters change (Step 3)
  useEffect(() => {
    if (currentStep === 3 && step1.imageUrl && step1.imageDimensions && step2.flagId) {
      // Render at high-res (2x) for preview to ensure crisp quality when scaled down
      // The preview container is 250-400px, so high-res gives us 2.5-4x resolution
      // This eliminates blur from CSS downscaling
      // Pass position/zoom directly to renderer - no capture needed
      render(step1.imageUrl, step2.flagId, {
        size: RENDER_SIZES.HIGH_RES,
        thickness: debouncedThickness,
        flagOffsetPct: debouncedFlagOffsetPct,
        presentation: step3.presentation,
        segmentRotation: debouncedSegmentRotation,
        bg: 'transparent',
        imagePosition: step1.imagePosition,
        imageDimensions: step1.imageDimensions,
        circleSize: step1.circleSize, // Still needed for position calculation
      });
    }
  }, [
    currentStep,
    step1.imageUrl,
    step1.imageDimensions,
    step1.imagePosition,
    step1.circleSize,
    step2.flagId,
    debouncedThickness,
    debouncedFlagOffsetPct,
    step3.presentation,
    debouncedSegmentRotation,
    render,
  ]);

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
    resetAll();
    setCurrentStep(1);
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
                <StepLayout
                  mainContent={
                    <ImageUploadZone
                      imageUrl={step1.imageUrl}
                      onImageUpload={handleImageUpload}
                      onShowPrivacy={() => setShowPrivacyModal(true)}
                      position={step1.imagePosition}
                      limits={positionLimits}
                      aspectRatio={aspectRatio}
                      imageDimensions={step1.imageDimensions}
                      onPositionChange={setImagePosition}
                      circleSize={step1.circleSize}
                      renderPositionControls={false}
                    />
                  }
                  controls={
                    step1.imageUrl ? (
                      <Step1PositionControls
                        position={step1.imagePosition}
                        limits={positionLimits}
                        onPositionChange={setImagePosition}
                      />
                    ) : undefined
                  }
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
                <StepLayout
                  mainContent={
                    <div className="flag-selector-wrapper">
                      <FlagSelector
                        flags={flags}
                        selectedFlagId={step2.flagId}
                        onFlagChange={setFlagId}
                      />
                      <FlagPreview flag={selectedFlag} />
                    </div>
                  }
                />
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
                <StepLayout
                  mainContent={
                    <ImageUploadZone
                      imageUrl={step1.imageUrl}
                      position={step1.imagePosition}
                      limits={positionLimits}
                      aspectRatio={aspectRatio}
                      imageDimensions={step1.imageDimensions}
                      circleSize={effectiveCircleSize}
                      baseCircleSize={step1.circleSize}
                      readonly={true}
                      flag={selectedFlag}
                      presentation={step3.presentation}
                      borderThicknessPct={step3.thickness}
                      flagOffsetPct={step3.flagOffsetPct}
                      segmentRotation={step3.segmentRotation}
                    />
                  }
                  controls={
                    <>
                      <PresentationModeSelector
                        mode={step3.presentation}
                        onModeChange={setPresentation}
                      />
                      <AdjustControls
                        thickness={step3.thickness}
                        onThicknessChange={setThickness}
                        flagOffsetPct={step3.flagOffsetPct}
                        onFlagOffsetChange={setFlagOffsetPct}
                        presentation={step3.presentation}
                        segmentRotation={step3.segmentRotation}
                        onSegmentRotationChange={setSegmentRotation}
                        selectedFlag={selectedFlag}
                      />
                    </>
                  }
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
          <div className="footer-line1 footer-social">
            <a
              href="https://share.upscrolled.com/en/user/845379f2-90be-4e4f-85db-35a62d99ef7e"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link footer-social-link"
              aria-label="Find us on UpScrolled"
            >
              <img
                src={getAssetUrl('upscrolled-icon.png')}
                alt=""
                width={28}
                height={28}
                className="footer-social-icon"
              />
            </a>
            <a
              href="https://www.instagram.com/wearebeyondbordersapp"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link footer-social-link"
              aria-label="Follow us on Instagram"
            >
              <img
                src={getAssetUrl('instagram-icon.svg')}
                alt=""
                width={28}
                height={28}
                className="footer-social-icon"
              />
            </a>
          </div>
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
