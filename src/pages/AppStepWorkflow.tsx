import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Slider from '@radix-ui/react-slider';
import { flags } from '@/flags/flags';
import { useAvatarRenderer } from '@/hooks/useAvatarRenderer';
import { useFlagImageCache } from '@/hooks/useFlagImageCache';
import { getAssetUrl } from '@/config';
import { FlagSelector } from '@/components/FlagSelector';
import { FlagPreview } from '@/components/FlagPreview';
import { ImageUploadZone } from '@/components/ImageUploadZone';
import { PresentationModeSelector, type PresentationMode } from '@/components/PresentationModeSelector';
import '../styles.css';

/**
 * AppStepWorkflow - Main application component
 * 
 * Three-step workflow for creating profile picture with flag border:
 * 1. Upload image
 * 2. Select flag
 * 3. Adjust and download
 */
export function AppStepWorkflow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [flagId, setFlagId] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const isHandlingPopState = useRef(false);
  
  // Step 3: Adjust controls state
  const [thickness, setThickness] = useState(10);
  const [insetPct, setInsetPct] = useState(0);
  const [flagOffsetX, setFlagOffsetX] = useState(0);
  const [presentation, setPresentation] = useState<PresentationMode>('ring');
  
  // Avatar rendering
  const flagImageCache = useFlagImageCache();
  const { overlayUrl, isRendering, render } = useAvatarRenderer(flags, flagImageCache);
  
  // Memoize selected flag to prevent unnecessary re-renders
  const selectedFlag = useMemo(() => {
    return flagId ? flags.find(f => f.id === flagId) ?? null : null;
  }, [flagId]);

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
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Preload] Failed to preload flag image:', error);
        }
      }
    };

    void preloadFlag();
  }, [selectedFlag?.png_full, flagImageCache]);
  
  /**
   * Sync currentStep to URL for browser navigation support
   * 
   * Uses pushState to update URL without page reload, enabling browser back/forward buttons.
   * The isHandlingPopState ref prevents infinite loops when handling browser navigation events.
   */
  useEffect(() => {
    // Don't update URL if we're handling a popstate event (browser navigation)
    if (isHandlingPopState.current) {
      isHandlingPopState.current = false;
      return;
    }

    const url = new URL(window.location.href);
    
    if (currentStep > 1) {
      url.searchParams.set('step', currentStep.toString());
    } else {
      url.searchParams.delete('step');
    }
    
    // Use pushState to allow browser back/forward navigation
    window.history.pushState({}, '', url.toString());
  }, [currentStep]);

  // Read initial step from URL on mount
  useEffect(() => {
    const url = new URL(window.location.href);
    const stepParam = url.searchParams.get('step');
    
    if (stepParam) {
      const requestedStep = parseInt(stepParam, 10);
      
      // Check current state directly
      const canGoTo2 = imageUrl !== null;
      const canGoTo3 = imageUrl !== null && flagId !== null;
      
      // Only restore step if we have the required data
      if (requestedStep === 2 && canGoTo2) {
        setCurrentStep(2);
      } else if (requestedStep === 3 && canGoTo3) {
        setCurrentStep(3);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      isHandlingPopState.current = true;
      const url = new URL(window.location.href);
      const stepParam = url.searchParams.get('step');
      
      if (!stepParam) {
        // No step param means go to step 1
        setCurrentStep(1);
      } else {
        const requestedStep = parseInt(stepParam, 10);
        
        // Validate step is in range
        if (requestedStep >= 1 && requestedStep <= 3) {
          // Check current state directly
          const canGoTo2 = imageUrl !== null;
          const canGoTo3 = imageUrl !== null && flagId !== null;
          
          // Only navigate if we have the required data
          if (requestedStep === 1) {
            setCurrentStep(1);
          } else if (requestedStep === 2 && canGoTo2) {
            setCurrentStep(2);
          } else if (requestedStep === 3 && canGoTo3) {
            setCurrentStep(3);
          } else {
            // Can't navigate to requested step, stay on current step
            // But update URL to reflect actual current step
            const url = new URL(window.location.href);
            if (currentStep > 1) {
              url.searchParams.set('step', currentStep.toString());
            } else {
              url.searchParams.delete('step');
            }
            window.history.replaceState({}, '', url.toString());
            isHandlingPopState.current = false;
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [imageUrl, flagId, currentStep]);

  // Trigger render when parameters change (Step 3)
  useEffect(() => {
    if (currentStep === 3 && imageUrl && flagId) {
      render(imageUrl, flagId, {
        size: 512,
        thickness,
        insetPct,
        flagOffsetX,
        presentation,
        bg: 'transparent',
      });
    }
  }, [currentStep, imageUrl, flagId, thickness, insetPct, flagOffsetX, presentation, render]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
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

  return (
    <>
      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="visually-hidden">
        Step {currentStep} of 3
      </div>

      {/* Main Canvas Container - matches mock exactly */}
      <main className="canvas" role="presentation" aria-label="Beyond Borders Application">
        {/* Header - outside content-wrapper */}
        <header className="app-header">
          <h1 className="app-title">Beyond Borders</h1>
          <p className="app-subtitle">Add a flag border to your profile picture</p>
        </header>

        {/* Content Wrapper - contains bg + progress + content + nav */}
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
              <div className="adjust-wrapper">
                {/* Avatar Preview */}
                <div className="avatar-preview">
                  {overlayUrl ? (
                    <img 
                      src={overlayUrl} 
                      alt={selectedFlag ? `Avatar with ${selectedFlag.displayName} border` : 'Avatar preview'}
                      className="avatar-preview-image"
                    />
                  ) : (
                    <div className="avatar-preview-placeholder">
                      {isRendering ? 'Rendering...' : 'Loading preview...'}
                    </div>
                  )}
                </div>

                {/* Presentation Mode Toggle Buttons */}
                <PresentationModeSelector
                  mode={presentation}
                  onModeChange={setPresentation}
                />

                {/* Adjust Controls */}
                <div className="adjust-controls">
                  {/* Thickness Slider */}
                  <div className="control-group">
                    <div className="slider-container">
                      <div className="slider-labels-row">
                        <span className="slider-end-label">Thinner</span>
                        <span className="slider-value">{thickness}%</span>
                        <span className="slider-end-label">Thicker</span>
                      </div>
                      <div className="slider-with-icons">
                        <span className="slider-icon" aria-label="Thinner border">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" fill="none"/>
                          </svg>
                        </span>
                        <Slider.Root
                          className="slider-root"
                          value={[thickness]}
                          onValueChange={([value]) => setThickness(value)}
                          min={5}
                          max={15}
                          step={1}
                          aria-label="Border thickness"
                        >
                          <Slider.Track className="slider-track">
                            <Slider.Range className="slider-range" />
                          </Slider.Track>
                        <Slider.Thumb className="slider-thumb" />
                      </Slider.Root>
                      <span className="slider-icon" aria-label="Thicker border">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"/>
                        </svg>
                      </span>
                    </div>
                  </div>
                  </div>

                  {/* Inset Slider */}
                  <div className="control-group">
                    <div className="slider-container">
                      <div className="slider-labels-row">
                        <span className="slider-end-label">Inset</span>
                        <span className="slider-value">{insetPct}%</span>
                        <span className="slider-end-label">Outset</span>
                      </div>
                      <div className="slider-with-icons">
                        <span className="slider-icon" aria-label="Inset (inside frame)">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"/>
                            <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          </svg>
                        </span>
                        <Slider.Root
                          className="slider-root"
                          value={[insetPct]}
                          onValueChange={([value]) => setInsetPct(value)}
                          min={-10}
                          max={10}
                          step={1}
                          aria-label="Border inset/outset"
                        >
                          <Slider.Track className="slider-track">
                            <Slider.Range className="slider-range" />
                          </Slider.Track>
                        <Slider.Thumb className="slider-thumb" />
                      </Slider.Root>
                      <span className="slider-icon" aria-label="Outset (more visible)">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1" fill="none"/>
                          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="3" fill="none"/>
                        </svg>
                      </span>
                    </div>
                  </div>
                  </div>

                  {/* Offset Slider - Only for Cutout Mode */}
                  {presentation === 'cutout' && (
                    <div className="control-group">
                      <div className="slider-container">
                        <div className="slider-labels-row">
                          <span className="slider-end-label">Flag L</span>
                          <span className="slider-value">{flagOffsetX}px</span>
                          <span className="slider-end-label">Flag R</span>
                        </div>
                        <div className="slider-with-icons">
                          <span className="slider-icon" aria-label="Left offset">
                            <svg width="26" height="20" viewBox="0 0 26 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="1" y="2" width="24" height="16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" fill="none"/>
                              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="3" fill="none"/>
                            </svg>
                          </span>
                          <Slider.Root
                            className="slider-root"
                            value={[flagOffsetX]}
                            onValueChange={([value]) => setFlagOffsetX(value)}
                            min={-50}
                            max={50}
                            step={1}
                            aria-label="Flag horizontal offset"
                          >
                            <Slider.Track className="slider-track">
                              <Slider.Range className="slider-range" />
                            </Slider.Track>
                            <Slider.Thumb className="slider-thumb" />
                          </Slider.Root>
                          <span className="slider-icon" aria-label="Right offset">
                            <svg width="26" height="20" viewBox="0 0 26 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="1" y="2" width="24" height="16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" fill="none"/>
                              <circle cx="16" cy="10" r="8" stroke="currentColor" strokeWidth="3" fill="none"/>
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Section */}
          <div className="nav-section">
            {currentStep === 1 && (
              <button
                type="button"
                className="nav-btn"
                onClick={() => setCurrentStep(2)}
                disabled={!imageUrl}
                aria-label="Go to next step"
              >
                <span>NEXT →</span>
              </button>
            )}
            
            {currentStep === 2 && (
              <>
                <button
                  type="button"
                  className="nav-btn"
                  onClick={() => setCurrentStep(1)}
                  aria-label="Go to previous step"
                >
                  <span>← BACK</span>
                </button>
                <button
                  type="button"
                  className="nav-btn"
                  onClick={() => setCurrentStep(3)}
                  disabled={!flagId}
                  aria-label="Go to next step"
                >
                  <span>NEXT →</span>
                </button>
              </>
            )}
            
            {currentStep === 3 && (
              <>
                <button
                  type="button"
                  className="nav-btn"
                  onClick={() => setCurrentStep(2)}
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
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-line1">Ethics and Sustainability | GitHub Open Source</div>
          <div className="footer-line2">© Nix Crabtree, 2025</div>
        </footer>
      </main>

      {/* Privacy Information Modal */}
      <Dialog.Root open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content 
            className="dialog-content" 
            aria-describedby="privacy-dialog-description"
            onOpenAutoFocus={(e) => {
              // Scroll to top when dialog opens
              e.preventDefault();
              const content = e.currentTarget as HTMLDivElement;
              if (content) {
                content.scrollTop = 0;
              }
            }}
          >
            <Dialog.Close asChild>
              <button 
                className="dialog-close-button"
                aria-label="Close dialog"
              >
                ×
              </button>
            </Dialog.Close>
            <Dialog.Title className="dialog-title">Your Privacy is Protected</Dialog.Title>
            
            <div className="dialog-body">
              <p id="privacy-dialog-description">
                Beyond Borders processes everything <strong>directly in your browser</strong>. Your images never leave your device.
              </p>
              
              <p><strong>What this means:</strong></p>
              
              <ul>
                <li>✓ No uploads to servers</li>
                <li>✓ No cloud storage</li>
                <li>✓ No tracking or analytics</li>
                <li>✓ Complete privacy and control</li>
              </ul>
              
              <p>
                All image processing happens using HTML5 Canvas technology in your browser. When you download your avatar, it's created and saved directly on your device. We never see, store, or have access to your images.
              </p>
              
              <p>
                This is an open source project so if you want to look through the code, it's{' '}
                <a 
                  href="https://github.com/ravendarque/ravendarque-beyond-borders"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dialog-link"
                >
                  here on GitHub
                </a>.
              </p>
            </div>

            <div className="dialog-actions">
              <Dialog.Close asChild>
                <button className="dialog-button">
                  Got it
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
