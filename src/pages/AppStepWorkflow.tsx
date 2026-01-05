import React, { useState, useEffect, useMemo } from 'react';
import { flags } from '@/flags/flags';
import { useAvatarRenderer } from '@/hooks/useAvatarRenderer';
import { useFlagImageCache } from '@/hooks/useFlagImageCache';
import { useStepNavigation } from '@/hooks/useStepNavigation';
import { useDebounce } from '@/hooks/usePerformance';
import { getAssetUrl } from '@/config';
import { FlagSelector } from '@/components/FlagSelector';
import { FlagPreview } from '@/components/FlagPreview';
import { ImageUploadZone } from '@/components/ImageUploadZone';
import { Link } from 'react-router-dom';
import { AdjustStep } from '@/components/AdjustStep';
import { PrivacyModal } from '@/components/PrivacyModal';
import type { PresentationMode } from '@/components/PresentationModeSelector';
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
  
  // Step 3: Adjust controls state
  const [thickness, setThickness] = useState(10);
  const [insetPct, setInsetPct] = useState(0);
  const [flagOffsetX, setFlagOffsetX] = useState(0);
  const [presentation, setPresentation] = useState<PresentationMode>('ring');
  const [segmentRotation, setSegmentRotation] = useState(0);
  
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

  // Set default offset when flag changes or when switching to cutout mode
  useEffect(() => {
    if (presentation === 'cutout') {
      const defaultOffset = selectedFlag?.modes?.cutout?.defaultOffset;
      if (defaultOffset !== undefined) {
        // Convert percentage (-50 to 50) to pixels
        // For a 512px canvas, -50% = -256px, 0% = 0px, 50% = 256px
        const defaultOffsetPx = (defaultOffset / 100) * 512;
        setFlagOffsetX(defaultOffsetPx);
      } else {
        // If in cutout mode but flag doesn't have cutout config, reset to 0
        setFlagOffsetX(0);
      }
    }
  }, [flagId, presentation, selectedFlag?.modes?.cutout?.defaultOffset, setFlagOffsetX]);

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
      } catch (error) {
        // Silent fail - preloading is best-effort
        // Error logged in development via debug logging if needed
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.warn('[Preload] Failed to preload flag image:', error);
        }
      }
    };

    void preloadFlag();
  }, [selectedFlag?.png_full, flagImageCache]);

  // Debounce slider values for smoother rendering during drag
  const debouncedThickness = useDebounce(thickness, 50);
  const debouncedInsetPct = useDebounce(insetPct, 50);
  const debouncedFlagOffsetX = useDebounce(flagOffsetX, 50);
  const debouncedSegmentRotation = useDebounce(segmentRotation, 50);

  // Trigger render when parameters change (Step 3)
  useEffect(() => {
    if (currentStep === 3 && imageUrl && flagId) {
      // Render at 1024px (2x) for preview to ensure crisp quality when scaled down
      // The preview container is 250-400px, so 1024px gives us 2.5-4x resolution
      // This eliminates blur from CSS downscaling
      render(imageUrl, flagId, {
        size: 1024,
        thickness: debouncedThickness,
        insetPct: debouncedInsetPct,
        flagOffsetX: debouncedFlagOffsetX,
        presentation,
        segmentRotation: debouncedSegmentRotation,
        bg: 'transparent',
      });
    }
  }, [currentStep, imageUrl, flagId, debouncedThickness, debouncedInsetPct, debouncedFlagOffsetX, presentation, debouncedSegmentRotation, render]);

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
    a.download = `beyond-borders-avatar-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleStartOver = () => {
    setImageUrl(null);
    setFlagId(null);
    setCurrentStep(1);
    setThickness(10);
    setInsetPct(0);
    setFlagOffsetX(0);
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
              <ImageUploadZone
                imageUrl={imageUrl}
                onImageUpload={handleImageUpload}
                onShowPrivacy={() => setShowPrivacyModal(true)}
              />
            )}

            {/* Step 2: Flag Selection */}
            {currentStep === 2 && (
              <div className="flag-selector-wrapper">
                <FlagSelector
                  flags={flags}
                  selectedFlagId={flagId}
                  onFlagChange={setFlagId}
                />
                <FlagPreview flag={selectedFlag} />
              </div>
            )}

            {/* Step 3: Adjust */}
            {currentStep === 3 && (
              <AdjustStep
                overlayUrl={overlayUrl}
                isRendering={isRendering}
                selectedFlag={selectedFlag}
                presentation={presentation}
                onPresentationChange={setPresentation}
                thickness={thickness}
                onThicknessChange={setThickness}
                insetPct={insetPct}
                onInsetChange={setInsetPct}
                flagOffsetX={flagOffsetX}
                onFlagOffsetChange={setFlagOffsetX}
                segmentRotation={segmentRotation}
                onSegmentRotationChange={setSegmentRotation}
              />
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
