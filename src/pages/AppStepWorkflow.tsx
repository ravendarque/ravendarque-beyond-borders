import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { ThemeModeContext } from '../main';
import { loadFlags } from '../flags/loader';
import { useFlagImageCache } from '@/hooks/useFlagImageCache';
import { useAvatarRenderer } from '@/hooks/useAvatarRenderer';
import { useFocusManagement } from '@/hooks/useFocusManagement';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useFlagPreloader } from '@/hooks/useFlagPreloader';
import { useStepWorkflow, Step } from '@/hooks/useStepWorkflow';
import {
  StepProgressIndicator,
  StepContainer,
  NavigationButtons,
  FlagDropdown,
  FlagPreview,
  PresentationControls,
  AvatarPreview,
} from '@/components';
import { ErrorAlert } from '@/components/ErrorAlert';
import Container from '@mui/material/Container';
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
import toast, { Toaster } from 'react-hot-toast';
import type { FlagSpec } from '@/flags/schema';
import type { AppError } from '@/types/errors';
import { normalizeError } from '@/types/errors';

const STEP_TITLES = ['Choose Image', 'Select Flag', 'Preview & Customize'];

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
  const [flagsLoading, setFlagsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const flagsListRef = useRef<FlagSpec[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Custom hooks
  const flagImageCache = useFlagImageCache();
  const { overlayUrl, isRendering, render } = useAvatarRenderer(flagsListRef.current, flagImageCache);
  const { focusRef: errorFocusRef, setFocus: focusError } = useFocusManagement<HTMLDivElement>();
  useFlagPreloader(flagsListRef.current, flagImageCache, flagId);

  /**
   * Load flags on mount
   */
  useEffect(() => {
    (async () => {
      try {
        setFlagsLoading(true);
        const loaded = await loadFlags();
        flagsListRef.current = (loaded as FlagSpec[]) || [];
        setFlagsLoading(false);
        setError(null);
      } catch (err) {
        flagsListRef.current = [];
        setFlagsLoading(false);
        setError(normalizeError(err));
      }
    })();
  }, []);

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
        thickness: 7,
        insetPct: 0,
        flagOffsetX: 0,
        presentation,
        bg: 'transparent',
      });
      setError(null);
      setStatusMessage('Avatar rendered successfully. Ready to download.');
    } catch (err) {
      const normalizedError = normalizeError(err);
      setError(normalizedError);
      toast.error(`Render failed: ${normalizedError.message}`);
      setStatusMessage(`Error: ${normalizedError.message}`);
    }
  }, [render, flagId, size, presentation]);

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
  const selectedFlag = flagsListRef.current.find(f => f.id === flagId) || null;

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
      <Container maxWidth="lg" component="main" id="main-content" aria-labelledby="app-title">
        {/* Header */}
        <Box component="header" role="banner" sx={{ py: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Typography variant="h4" component="h1" id="app-title" sx={{ fontWeight: 700 }}>
              Beyond Borders
            </Typography>
            <IconButton 
              size={isMobile ? 'large' : 'medium'}
              onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
              aria-label={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
            </IconButton>
          </Stack>
          <Typography variant="subtitle1" color="textSecondary" component="p">
            Add a circular, flag-colored border to your profile picture. Follow the steps below to create your avatar.
          </Typography>
        </Box>

        {/* Step Progress Indicator */}
        <Box sx={{ mb: 4 }}>
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
        </Box>

        {/* Error Display */}
        {error && (
          <Box ref={errorFocusRef} tabIndex={-1} sx={{ mb: 3, outline: 'none' }}>
            <ErrorAlert
              error={error}
              onRetry={() => {
                setError(null);
                if (flagsListRef.current.length === 0) {
                  setFlagsLoading(true);
                  loadFlags().then(loaded => {
                    flagsListRef.current = (loaded as FlagSpec[]) || [];
                    setFlagsLoading(false);
                    setError(null);
                  }).catch(err => {
                    setFlagsLoading(false);
                    setError(normalizeError(err));
                  });
                } else if (imageUrl && flagId) {
                  renderWithImageUrl(imageUrl);
                }
              }}
              onDismiss={() => setError(null)}
            />
          </Box>
        )}

        {/* Step Content */}
        {currentStep === 1 && (
          <StepContainer maxWidth="md">
            <Stack spacing={3} alignItems="center">
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
                  width: 300,
                  height: 300,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
                    // No image - show selection prompt
                    border: 3,
                    borderColor: 'grey.300',
                    borderStyle: 'dashed',
                    bgcolor: 'grey.50',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'grey.100',
                    },
                  }),
                }}
              >
                {!imageUrl && (
                  <Box sx={{ textAlign: 'center', px: 4 }}>
                    <FileUploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                      Choose your profile image
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      or drag and drop it here
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
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
              
              <NavigationButtons
                currentStep={currentStep}
                canGoBack={false}
                canGoNext={canProceedFromStep1}
                onNext={nextStep}
                nextLabel="Select Flag"
              />
            </Stack>
          </StepContainer>
        )}

        {currentStep === 2 && (
          <StepContainer
            title={STEP_TITLES[1]}
            description="Choose a flag to add as a border"
            maxWidth="md"
          >
            <Stack spacing={3}>
              <FlagDropdown
                flags={flagsListRef.current}
                selectedFlagId={flagId}
                onChange={handleFlagChange}
                disabled={flagsLoading}
              />
              
              {selectedFlag && (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <FlagPreview
                    flag={selectedFlag}
                    size="large"
                    animate={true}
                    showDescription={true}
                    showCategory={true}
                  />
                </Box>
              )}
            </Stack>

            <NavigationButtons
              currentStep={currentStep}
              canGoBack={true}
              canGoNext={canProceedFromStep2}
              onBack={prevStep}
              onNext={nextStep}
              onStartOver={startOver}
              backLabel="Back to Image"
              nextLabel="Customize"
            />
          </StepContainer>
        )}

        {currentStep === 3 && (
          <StepContainer
            title={STEP_TITLES[2]}
            description="Preview your avatar and customize the border style"
            maxWidth="lg"
          >
            <Stack spacing={3}>
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
              <PresentationControls
                value={presentation}
                onChange={setPresentation}
              />

              {/* Download/Copy Buttons */}
              <Stack direction="row" spacing={2} sx={{ justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={handleCopy}
                  disabled={!overlayUrl || isCopying}
                >
                  {isCopying ? 'Copying...' : 'Copy to Clipboard'}
                </Button>
              </Stack>
            </Stack>

            <NavigationButtons
              currentStep={currentStep}
              canGoBack={true}
              canGoNext={false}
              onBack={prevStep}
              onFinish={handleDownload}
              onStartOver={startOver}
              isLoading={isDownloading}
              backLabel="Back to Flag Selection"
              finishLabel="Download Avatar"
            />
          </StepContainer>
        )}

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
      </Container>
    </>
  );
}
