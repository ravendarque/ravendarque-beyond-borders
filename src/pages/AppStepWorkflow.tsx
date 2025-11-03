import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { ThemeModeContext } from '../main';
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

import FileUploadIcon from '@mui/icons-material/UploadFile';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import toast, { Toaster } from 'react-hot-toast';
import type { AppError } from '@/types/errors';
import { normalizeError } from '@/types/errors';

const STEP_TITLES = ['Image', 'Flag', 'Adjust'];

export function AppStepWorkflow() {
  const { mode, setMode } = useContext(ThemeModeContext);
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
          style: {
            background: mode === 'dark' ? '#333' : '#fff',
            color: mode === 'dark' ? '#fff' : '#333',
          },
        }}
      />

      {/* Screen Reader Announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="visually-hidden">
        {statusMessage}
      </div>
      <div role="alert" aria-live="assertive" aria-atomic="true" className="visually-hidden">
        {error ? `Error: ${error.message}` : ''}
      </div>

      {/* Main Container */}
      <Box
        component="main"
        id="main-content"
        aria-labelledby="app-title"
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3 },
          bgcolor: 'background.default',
        }}
      >
        {/* Settings Icon - Fixed Position (bottom-right) */}
        <IconButton 
          size={isMobile ? 'large' : 'medium'}
          onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
          aria-label={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          sx={{ 
            position: 'fixed', 
            bottom: 24, 
            right: 24, 
            zIndex: 1000,
            bgcolor: 'white',
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
            '&:hover': {
              bgcolor: 'grey.100',
            }
          }}
        >
          {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
        </IconButton>

        {/* Centered Content Column */}
        <Box sx={{ maxWidth: 600, width: '100%', mx: 'auto' }}>
          {/* Header with dark curved background */}
          <Box component="header" role="banner" sx={{ mb: { xs: 2, sm: 3 }, textAlign: 'center', position: 'relative' }}>
            {/* Dark curved shape background */}
            <Box
              sx={{
                position: 'absolute',
                top: { xs: -24, sm: -32 },
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100vw',
                height: { xs: 120, sm: 140 },
                bgcolor: '#1B1F22',
                borderRadius: '0 0 50% 50% / 0 0 30% 30%',
                zIndex: -1,
              }}
            />
            <Typography 
              variant="h3" 
              component="h1" 
              id="app-title" 
              sx={{ 
                fontWeight: 400, 
                mb: 1,
                fontSize: { xs: '2rem', sm: '2rem' },
                color: '#FFFFFF',
                letterSpacing: '0.02em',
                pt: { xs: 1, sm: 2 },
              }}
            >
              BEYOND BORDERS
            </Typography>
            <Typography 
              variant="body1" 
              component="p"
              sx={{
                color: '#FFFFFF',
                fontSize: { xs: '0.875rem', sm: '0.875rem' },
                fontWeight: 400,
                lineHeight: 1.2,
                px: 2,
              }}
            >
              Add a flag border to your profile picture
            </Typography>
          </Box>

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
            <Box ref={errorFocusRef} tabIndex={-1} sx={{ mb: { xs: 1.5, sm: 2 }, outline: 'none' }}>
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
            </Box>
          )}

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
            <Box
              component="label"
              htmlFor="step1-file-upload"
              sx={{
                width: 279,
                maxWidth: 279,
                height: 279,
                aspectRatio: '1',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: { xs: 2, sm: 3 },
                mt: { xs: 1, sm: 2 },
                cursor: 'pointer',
                transition: 'all 0.2s',
                ...(imageUrl ? {
                  // Has image - show preview
                  backgroundImage: `url(${imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  boxShadow: 3,
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'scale(1.02)',
                  },
                } : {
                  // No image - show selection prompt with dark background
                  border: '2.5px dashed rgba(255, 255, 255, 0.2)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderStyle: 'dashed',
                    bgcolor: '#1B1F22',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                      bgcolor: '#252A2E',
                    },
                  }),
                }}
              >
                {!imageUrl && (
                  <Box sx={{ textAlign: 'center', px: 3 }}>
                    <FileUploadIcon sx={{ fontSize: 57, color: '#DADADA', mb: 1.5 }} />
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 400,
                        color: '#FFFFFF',
                        mb: 1,
                        fontSize: '0.9375rem',
                      }}
                    >
                      Choose your profile picture
                    </Typography>
                    <Typography 
                      variant="body2" 
                      display="block" 
                      sx={{ 
                        mb: 2,
                        color: '#FFFFFF',
                        fontSize: '0.8125rem',
                      }}
                    >
                      JPG or PNG
                    </Typography>
                    <Box
                      component="button"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowPrivacyModal(true);
                      }}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        color: 'primary.main',
                        textDecoration: 'underline',
                        textDecorationStyle: 'dotted',
                        fontSize: '0.75rem',
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
                      aria-label="Learn about privacy: Your image stays on your device"
                    >
                      <InfoOutlinedIcon sx={{ fontSize: 14 }} />
                      Stays on your device
                    </Box>
                  </Box>
                )}
              </Box>
              
              <Box sx={{ mb: 3 }} />
              
              <Box sx={{ width: '100%', maxWidth: 300, mx: 'auto' }}>
                <NavigationButtons
                  currentStep={currentStep}
                  canGoBack={false}
                  canGoNext={canProceedFromStep1}
                  onNext={nextStep}
                  nextLabel="SELECT FLAG"
                />
              </Box>
            </>
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
                      />

                      <SliderControl
                        label="Profile Image Inset/Outset"
                        value={insetPct}
                        min={-10}
                        max={10}
                        step={1}
                        onChange={setInsetPct}
                        unit="%"
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
        </Box>

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
      </Box>
    </>
  );
}
