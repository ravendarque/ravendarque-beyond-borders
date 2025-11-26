import React, { useState, useEffect } from 'react';
import * as Select from '@radix-ui/react-select';
import * as Dialog from '@radix-ui/react-dialog';
import * as Slider from '@radix-ui/react-slider';
import { flags } from '@/flags/flags';
import { useAvatarRenderer } from '@/hooks/useAvatarRenderer';
import { useFlagImageCache } from '@/hooks/useFlagImageCache';
import '../styles.css';

/**
 * Clean reimplementation of AppStepWorkflow starting from the mock HTML/CSS
 * This matches the exact structure and styling of step1-mock-responsive.html
 */
export function AppStepWorkflowClean() {
  const [currentStep, setCurrentStep] = useState(1);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [flagId, setFlagId] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  // Step 3: Adjust controls state
  const [thickness, setThickness] = useState(7);
  const [insetPct, setInsetPct] = useState(0);
  const [flagOffsetX, setFlagOffsetX] = useState(0);
  const [presentation, setPresentation] = useState<'ring' | 'segment' | 'cutout'>('ring');
  
  // Avatar rendering
  const flagImageCache = useFlagImageCache();
  const { overlayUrl, isRendering, render } = useAvatarRenderer(flags, flagImageCache);
  
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
            <div className={currentStep >= 1 ? "progress" : "progress disabled"}>
              <span><span className="progress-number">1/</span>IMAGE</span>
            </div>
            <div className={currentStep >= 2 ? "progress" : "progress disabled"}>
              <span><span className="progress-number">2/</span>FLAG</span>
            </div>
            <div className={currentStep >= 3 ? "progress" : "progress disabled"}>
              <span><span className="progress-number">3/</span>ADJUST</span>
            </div>
          </div>

          {/* Content Area */}
          <div className="content-area">
            {/* Step 1: Image Upload */}
            {currentStep === 1 && (
              <>
                <input
                  type="file"
                  id="step1-file-upload"
                  accept="image/jpeg,image/jpg,image/png"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
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
                        <div className="icon" aria-hidden="true">IMG</div>
                        <div className="prompt">Choose your profile picture</div>
                        <div className="formats">JPG or PNG</div>
                        <button
                          type="button"
                          className="privacy"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowPrivacyModal(true);
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
            )}

            {/* Step 2: Flag Selection */}
            {currentStep === 2 && (
              <div className="flag-selector-wrapper">
                <div className="flag-selector">
                  <Select.Root value={flagId || undefined} onValueChange={setFlagId}>
                    <Select.Trigger className="flag-select-trigger" aria-label="Choose a flag">
                      <Select.Value placeholder="Choose a flag" />
                      <Select.Icon className="flag-select-icon">▼</Select.Icon>
                    </Select.Trigger>

                    <Select.Portal>
                      <Select.Content className="flag-select-content" position="popper">
                        <Select.Viewport>
                          {/* Authoritarian Regimes */}
                          <Select.Group>
                            <Select.Label className="flag-select-label">Authoritarian Regimes</Select.Label>
                            {flags.filter(f => f.category === 'authoritarian').map((flag) => (
                              <Select.Item key={flag.id} value={flag.id} className="flag-select-item">
                                <Select.ItemText>{flag.displayName}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Group>

                          {/* Occupied Territories */}
                          <Select.Group>
                            <Select.Label className="flag-select-label">Occupied Territories</Select.Label>
                            {flags.filter(f => f.category === 'occupied').map((flag) => (
                              <Select.Item key={flag.id} value={flag.id} className="flag-select-item">
                                <Select.ItemText>{flag.displayName}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Group>

                          {/* Stateless Peoples */}
                          <Select.Group>
                            <Select.Label className="flag-select-label">Stateless Peoples</Select.Label>
                            {flags.filter(f => f.category === 'stateless').map((flag) => (
                              <Select.Item key={flag.id} value={flag.id} className="flag-select-item">
                                <Select.ItemText>{flag.displayName}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Group>

                          {/* Oppressed Groups */}
                          <Select.Group>
                            <Select.Label className="flag-select-label">Oppressed Groups</Select.Label>
                            {flags.filter(f => f.category === 'oppressed').map((flag) => (
                              <Select.Item key={flag.id} value={flag.id} className="flag-select-item">
                                <Select.ItemText>{flag.displayName}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Group>
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>

                {/* Flag Preview */}
                <div className="flag-preview">
                  {(() => {
                    if (!flagId) {
                      return <div className="flag-preview-placeholder">Select a flag to see preview</div>;
                    }
                    const selectedFlag = flags.find(f => f.id === flagId);
                    const imageSrc = selectedFlag?.png_preview || selectedFlag?.png_full;
                    return imageSrc ? (
                      <img 
                        src={`/flags/${imageSrc}`}
                        alt={selectedFlag?.displayName}
                        className="flag-preview-image"
                      />
                    ) : <div className="flag-preview-placeholder">No preview available</div>;
                  })()}
                </div>
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
                      alt="Avatar preview"
                      className="avatar-preview-image"
                    />
                  ) : (
                    <div className="avatar-preview-placeholder">
                      {isRendering ? 'Rendering...' : 'Loading preview...'}
                    </div>
                  )}
                </div>

                {/* Presentation Mode Toggle Buttons */}
                <div className="presentation-controls">
                  <div className="presentation-toggle-group" role="radiogroup" aria-label="Presentation style">
                    <button
                      type="button"
                      className={`presentation-toggle ${presentation === 'ring' ? 'selected' : ''}`}
                      onClick={() => setPresentation('ring')}
                      aria-pressed={presentation === 'ring'}
                      aria-label="Ring - Full circular border around the entire avatar"
                    >
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      </svg>
                      <span>Ring</span>
                    </button>
                    <button
                      type="button"
                      className={`presentation-toggle ${presentation === 'segment' ? 'selected' : ''}`}
                      onClick={() => setPresentation('segment')}
                      aria-pressed={presentation === 'segment'}
                      aria-label="Segment - Partial arc border on one side of the avatar"
                    >
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <line x1="16" y1="4" x2="16" y2="10" stroke="currentColor" strokeWidth="1.5"/>
                        <line x1="16" y1="22" x2="16" y2="28" stroke="currentColor" strokeWidth="1.5"/>
                        <line x1="4" y1="16" x2="10" y2="16" stroke="currentColor" strokeWidth="1.5"/>
                        <line x1="22" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      </svg>
                      <span>Segment</span>
                    </button>
                    <button
                      type="button"
                      className={`presentation-toggle ${presentation === 'cutout' ? 'selected' : ''}`}
                      onClick={() => setPresentation('cutout')}
                      aria-pressed={presentation === 'cutout'}
                      aria-label="Cutout - Flag pattern fills the border area completely"
                    >
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="4" width="30" height="24" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" fill="none"/>
                        <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      </svg>
                      <span>Cutout</span>
                    </button>
                  </div>
                </div>

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
                          max={20}
                          step={1}
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
