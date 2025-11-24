import React, { useEffect, useRef, useState, useCallback } from 'react';
import { flags } from '@/flags/flags';
import { useFlagImageCache } from '@/hooks/useFlagImageCache';
import { useAvatarRenderer } from '@/hooks/useAvatarRenderer';
import { useFocusManagement } from '@/hooks/useFocusManagement';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useFlagPreloader } from '@/hooks/useFlagPreloader';
import { useStepWorkflow, Step } from '@/hooks/useStepWorkflow';
import {
  StepProgressIndicator,
  NavigationButtons,
  FlagDropdown,
  FlagPreview,
  PresentationControls,
  AvatarPreview,
  SliderControl,
} from '@/components';
import { ErrorAlert } from '@/components/ErrorAlert';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import toast, { Toaster } from 'react-hot-toast';
import type { AppError } from '@/types/errors';
import { normalizeError } from '@/types/errors';
// Icons for slider controls
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PanoramaFishEyeIcon from '@mui/icons-material/PanoramaFishEye';

const STEP_TITLES = ['Image', 'Flag', 'Adjust'];

export function AppStepWorkflow() {
  const theme = useTheme();

  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // Constants
  const size = 1024 as const;
  const displaySize = isMobile ? Math.min(window.innerWidth - 80, 280) : isTablet ? 320 : 300;

  // Step workflow state - handles imageUrl, flagId, and navigation
  const {
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    startOver,
    completedSteps,
    imageUrl,
    setImageUrl,
    flagId,
    setFlagId,
  } = useStepWorkflow();

  // App state (local to this component)
  const [presentation, setPresentation] = useState<'ring' | 'segment' | 'cutout'>('ring');
  const [thickness, setThickness] = useState(7);
  const [insetPct, setInsetPct] = useState(0);
  const [flagOffsetX, setFlagOffsetX] = useState(0);
  const [bg, setBg] = useState<string | 'transparent'>('transparent');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Custom hooks - flags are now statically imported
  const flagImageCache = useFlagImageCache();
  const { overlayUrl, isRendering, render } = useAvatarRenderer(flags, flagImageCache);
  const { focusRef: errorFocusRef, setFocus: focusError } = useFocusManagement<HTMLDivElement>();
  useFlagPreloader(flags, flagImageCache, flagId);

  /**
   * Handle image selection
   */
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setStatusMessage('Image selected successfully. Ready to select flag.');
  }
  
  /**
   * Handle flag selection change
   */
  function handleFlagChange(id: string | null) {
    setFlagId(id || '');
  }

  /**
   * Render avatar with current settings
   */
  const renderWithImageUrl = useCallback(async (specificImageUrl: string) => {
    try {
      setStatusMessage('Rendering avatar...');
      await render(specificImageUrl, flagId, {
        size,
        thickness,
        insetPct,
        flagOffsetX,
        presentation,
        bg,
      });
      setError(null);
      setStatusMessage('Avatar rendered successfully. Ready to download.');
    } catch (err) {
      const normalizedError = normalizeError(err);
      setError(normalizedError);
      toast.error(`Render failed: ${normalizedError.message}`);
      setStatusMessage(`Error: ${normalizedError.message}`);
    }
  }, [render, flagId, size, thickness, insetPct, flagOffsetX, presentation, bg]);

  /**
   * Auto-render when image, flag, or settings change
   */
  useEffect(() => {
    if (imageUrl && flagId) {
      void renderWithImageUrl(imageUrl);
    }
  }, [imageUrl, flagId, renderWithImageUrl]);

  /**
   * Cleanup: revoke imageUrl on unmount
   */
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  /**
   * Focus on error when it appears
   */
  useEffect(() => {
    if (error) {
      setTimeout(() => focusError(), 100);
    }
  }, [error, focusError]);

  /**
   * Download rendered avatar
   */
  async function handleDownload() {
    if (!overlayUrl) return;
    try {
      setIsDownloading(true);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const a = document.createElement('a');
      a.href = overlayUrl;
      a.download = 'avatar-with-border.png';
      a.click();
      toast.success('Avatar downloaded successfully!');
      setStatusMessage('Avatar downloaded successfully.');
    } catch {
      toast.error('Failed to download avatar');
      setStatusMessage('Failed to download avatar.');
    } finally {
      setIsDownloading(false);
    }
  }

  /**
   * Copy avatar to clipboard
   */
  async function handleCopy() {
    if (!overlayUrl) return;

    try {
      setIsCopying(true);
      
      if (!navigator.clipboard || !window.ClipboardItem) {
        const message = 'Copy to clipboard not supported in this browser';
        toast.error(message);
        setStatusMessage(message);
        setError(normalizeError(new Error('Clipboard API not supported')));
        return;
      }

      const response = await fetch(overlayUrl);
      const blob = await response.blob();
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);

      toast.success('Avatar copied to clipboard!');
      setStatusMessage('Avatar copied to clipboard!');
      setError(null);
    } catch (err) {
      const message = 'Failed to copy to clipboard';
      toast.error(message);
      setStatusMessage(message);
      setError(normalizeError(err));
    } finally {
      setIsCopying(false);
    }
  }

  /**
   * Keyboard shortcuts
   */
  useKeyboardShortcuts([
    {
      key: 'd',
      ctrlKey: true,
      callback: (e) => {
        e.preventDefault();
        handleDownload();
      },
      description: 'Download avatar',
      enabled: !!overlayUrl,
    },
  ]);

  // Find selected flag object for preview
  const selectedFlag = flags.find(f => f.id === flagId) || null;

  // Determine if we can proceed to next step
  const canProceedFromStep1 = !!imageUrl;
  const canProceedFromStep2 = !!flagId;

  return (
    <>
      {/* Toast Notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
        }}
      />

      {/* Screen Reader Announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="visually-hidden">
        {statusMessage}
      </div>
      <div role="alert" aria-live="assertive" aria-atomic="true" className="visually-hidden">
        {error ? `Error: ${error.message}` : ''}
      </div>

      {/* Main Canvas Container */}
      <main className="canvas" id="main-content" aria-labelledby="app-title">
        {/* Header - outside content-wrapper */}
        <header className="app-header">
          <h1 className="app-title" id="app-title">
            Beyond Borders
          </h1>
          <p className="app-subtitle">
            Add a flag border to your profile picture
          </p>
        </header>

        {/* Content Wrapper - contains bg + progress + content + nav */}
        <div className="content-wrapper">
          {/* Background */}
          <div className="content-bg" aria-hidden="true"></div>

          {/* Step Progress Indicator */}
          <StepProgressIndicator
            currentStep={currentStep}
            completedSteps={completedSteps}
            steps={STEP_TITLES.map((title, index) => ({
              number: (index + 1) as Step,
              label: title,
              title: title,
            }))}
            onStepClick={goToStep}
          />

          {/* Error Display */}
          {error && (
            <div ref={errorFocusRef} tabIndex={-1} className="error-container">
              <ErrorAlert
                error={error}
                onRetry={() => {
                  setError(null);
                  if (imageUrl && flagId) {
                    renderWithImageUrl(imageUrl);
                  }
                }}
                onDismiss={() => setError(null)}
              />
            </div>
          )}

          {/* Content Area */}
          <div className="content-area">
            {/* Step Content */}
          {currentStep === 1 && (
            <>
              {/* Hidden file input */}
              <input
                ref={inputRef}
                accept="image/jpeg,image/jpg,image/png"
                style={{ display: 'none' }}
                id="step1-file-upload"
                type="file"
                onChange={handleImageUpload}
                aria-label="Choose image file (JPG or PNG, max 10 MB)"
              />
            
              {/* Clickable preview area */}
              <div className="choose-wrapper">
                <label
                  htmlFor="step1-file-upload"
                  className={imageUrl ? "choose-circle has-image" : "choose-circle"}
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
          </div>

          {/* Navigation Section */}
          <div className="nav-section">
            {currentStep === 1 && (
              <NavigationButtons
                currentStep={currentStep}
                canGoBack={false}
                canGoNext={canProceedFromStep1}
                onNext={nextStep}
                nextLabel="Select Flag"
              />
            )}

          {currentStep === 2 && (
            <>
              <Stack spacing={3} sx={{ mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ width: '100%', maxWidth: 320 }}>
                    <FlagDropdown
                      flags={flags}
                      selectedFlagId={flagId}
                      onChange={handleFlagChange}
                      disabled={false}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <FlagPreview
                    flag={selectedFlag}
                    size="large"
                    animate={true}
                  />
                </Box>
              </Stack>

              <Box sx={{ width: '100%', maxWidth: 300, mx: 'auto' }}>
                <NavigationButtons
                  currentStep={currentStep}
                  canGoBack={true}
                  canGoNext={canProceedFromStep2}
                  onBack={prevStep}
                  onNext={nextStep}
                  onStartOver={startOver}
                  backLabel="Back"
                  nextLabel="Adjust"
                />
              </Box>
            </>
          )}

          {currentStep === 3 && (
            <>
              <Stack spacing={3} sx={{ mb: { xs: 2, sm: 3 } }}>
                {/* Preview Section */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <AvatarPreview
                    size={size}
                    displaySize={displaySize}
                    canvasRef={canvasRef}
                    overlayUrl={overlayUrl}
                    isRendering={isRendering}
                    hasImage={!!imageUrl}
                    hasFlag={!!flagId}
                  />
                </Box>

                {/* Customization Controls */}
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ width: '100%', maxWidth: 400 }}>
                    <PresentationControls
                      value={presentation}
                      onChange={setPresentation}
                    />
                  </Box>
                </Box>

                {/* Adjustment Controls */}
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ maxWidth: 400, width: '100%' }}>
                    <Stack spacing={3}>
                      <SliderControl
                        label="Border thickness"
                        value={thickness}
                        min={3}
                        max={20}
                        step={1}
                        onChange={setThickness}
                        unit="%"
                        startIcon={
                          <RadioButtonUncheckedIcon 
                            fontSize="small" 
                            sx={{ fontSize: '20px', strokeWidth: 1 }} 
                          />
                        }
                        endIcon={
                          <RadioButtonUncheckedIcon 
                            fontSize="small" 
                            sx={{ 
                              fontSize: '20px',
                              '& path': {
                                strokeWidth: 3,
                                stroke: 'currentColor',
                              }
                            }} 
                          />
                        }
                        startIconLabel="Thinner border"
                        endIconLabel="Thicker border"
                      />

                      <SliderControl
                        label="Profile Image Inset/Outset"
                        value={insetPct}
                        min={-10}
                        max={10}
                        step={1}
                        onChange={setInsetPct}
                        unit="%"
                        startIcon={<AccountCircleIcon fontSize="small" sx={{ fontSize: '20px' }} />}
                        endIcon={
                          <Box sx={{ position: 'relative', width: '20px', height: '20px', display: 'inline-flex' }}>
                            <PanoramaFishEyeIcon sx={{ fontSize: '20px', position: 'absolute', top: 0, left: 0 }} />
                            <AccountCircleIcon sx={{ fontSize: '10px', position: 'absolute', top: '5px', left: '5px' }} />
                          </Box>
                        }
                        startIconLabel="Outset (more visible)"
                        endIconLabel="Inset (inside frame)"
                      />

                      {presentation === 'cutout' && (
                        <SliderControl
                          label="Flag Horizontal Offset"
                          value={flagOffsetX}
                          min={-200}
                          max={200}
                          step={5}
                          onChange={setFlagOffsetX}
                          unit="px"
                          startIcon={
                            <Box sx={{ position: 'relative', width: '30px', height: '20px', display: 'inline-flex' }}>
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '26px',
                                  height: '16px',
                                  border: '2px dashed',
                                  borderColor: 'text.secondary',
                                  boxSizing: 'content-box',
                                }}
                              />
                              <RadioButtonUncheckedIcon sx={{ fontSize: '20px', position: 'absolute', top: 0, left: 0 }} />
                            </Box>
                          }
                          endIcon={
                            <Box sx={{ position: 'relative', width: '30px', height: '20px', display: 'inline-flex' }}>
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  right: 0,
                                  width: '26px',
                                  height: '16px',
                                  border: '2px dashed',
                                  borderColor: 'text.secondary',
                                  boxSizing: 'content-box',
                                }}
                              />
                              <RadioButtonUncheckedIcon sx={{ fontSize: '20px', position: 'absolute', top: 0, right: 0 }} />
                            </Box>
                          }
                          startIconLabel="Flag on left"
                          endIconLabel="Flag on right"
                        />
                      )}

                      <FormControl fullWidth>
                        <InputLabel id="background-select-label">Background</InputLabel>
                        <Select 
                          value={bg} 
                          onChange={(e) => setBg(e.target.value)}
                          label="Background"
                          labelId="background-select-label"
                        >
                          <MenuItem value="transparent">Transparent</MenuItem>
                          <MenuItem value="#ffffff">White</MenuItem>
                          <MenuItem value="#000000">Black</MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>
                  </Box>
                </Box>
              </Stack>

              <Box sx={{ mb: 3 }} />

              <Box sx={{ width: '100%', maxWidth: 300, mx: 'auto' }}>
                <NavigationButtons
                  currentStep={currentStep}
                  canGoBack={true}
                  canGoNext={false}
                  onBack={prevStep}
                  onFinish={handleDownload}
                  onStartOver={startOver}
                  isLoading={isDownloading}
                  backLabel="Back"
                  finishLabel="Download"
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button
                  variant="text"
                  onClick={handleCopy}
                  disabled={!overlayUrl || isCopying}
                  sx={{ 
                    color: 'text.secondary',
                    minHeight: 44, // Accessibility: adequate touch target
                  }}
                >
                  {isCopying ? 'Copying...' : 'Copy to Clipboard'}
                </Button>
              </Box>
            </>
          )}
          </div>
        </div>

        {/* Privacy Information Modal */}
        <Dialog
          open={showPrivacyModal}
          onClose={() => setShowPrivacyModal(false)}
          maxWidth="sm"
          fullWidth
          aria-labelledby="privacy-dialog-title"
          aria-describedby="privacy-dialog-description"
        >
          <DialogTitle id="privacy-dialog-title">
            Your Privacy is Protected
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Typography variant="body1" id="privacy-dialog-description">
                Beyond Borders processes everything <strong>directly in your browser</strong>. Your images never leave your device.
              </Typography>
              
              <Typography variant="body2">
                <strong>What this means:</strong>
              </Typography>
              
              <Box component="ul" sx={{ pl: 2, my: 1 }}>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  ✓ No uploads to servers
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  ✓ No cloud storage
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  ✓ No tracking or analytics
                </Typography>
                <Typography component="li" variant="body2">
                  ✓ Complete privacy and control
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                All image processing happens using HTML5 Canvas technology in your browser. When you download your avatar, it's created and saved directly on your device. We never see, store, or have access to your images.
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                This is an open source project so if you want to look through the code, it's{' '}
                <Box
                  component="a"
                  href="https://github.com/ravendarque/ravendarque-beyond-borders"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'underline',
                    '&:hover': {
                      color: 'primary.dark',
                    },
                    '&:focus-visible': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: 2,
                      borderRadius: 0.5,
                    },
                  }}
                >
                  here on GitHub
                </Box>
                .
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setShowPrivacyModal(false)} 
              variant="contained"
              autoFocus
            >
              Got it
            </Button>
          </DialogActions>
        </Dialog>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-line1">Ethics and Sustainability | GitHub Open Source</div>
          <div className="footer-line2">© Nix Crabtree, 2025</div>
        </footer>
      </main>
    </>
  );
}
