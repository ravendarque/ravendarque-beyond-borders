import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { ThemeModeContext } from '../main';
import { flags } from '@/flags/flags';
import { useFlagImageCache } from '@/hooks/useFlagImageCache';
import { useAvatarRenderer } from '@/hooks/useAvatarRenderer';
import { useFocusManagement } from '@/hooks/useFocusManagement';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useFlagPreloader } from '@/hooks/useFlagPreloader';
import { useStepWorkflow } from '@/hooks/useStepWorkflow';
import {
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
          bgcolor: '#D9D3CD',
          pb: 12, // Extra padding for footer
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
          {/* Header with SVG shape and step indicators positioned in cutouts */}
          <Box 
            component="header" 
            role="banner" 
            sx={{ 
              mb: 2,
              textAlign: 'center', 
              position: 'relative',
              mx: 'auto',
              width: 306,
              height: 102,
            }}
          >
            {/* SVG Header with circular cutouts */}
            <Box
              component="svg"
              width="306"
              height="102.13"
              viewBox="0 0 306 102.13"
              xmlns="http://www.w3.org/2000/svg"
              sx={{ position: 'absolute', top: 0, left: 0 }}
            >
              <path 
                d="M152.521 -334.5C294.459 -334.5 409.521 -219.437 409.521 -77.5C409.521 23.8251 350.883 72.2109 265.69 91.6064C263.825 79.926 253.706 71 241.5 71C227.969 71 217 81.969 217 95.5C217 96.8278 217.106 98.1308 217.31 99.4014C203.961 100.788 190.19 101.675 176.091 102.129C176.682 100.02 177 97.7974 177 95.5C177 81.969 166.031 71 152.5 71C138.969 71 128 81.969 128 95.5C128 97.7966 128.317 100.019 128.908 102.127C114.809 101.672 101.038 100.785 87.6895 99.3965C87.8923 98.1274 88 96.8262 88 95.5C88 81.969 77.031 71 63.5 71C51.2975 71 41.1799 79.921 39.3105 91.5967C-45.8593 72.1948 -104.479 23.8086 -104.479 -77.5C-104.479 -219.437 10.5843 -334.5 152.521 -334.5Z"
                fill="#1B1F22"
              />
            </Box>

            {/* Header Text */}
            <Typography 
              variant="h3" 
              component="h1" 
              id="app-title" 
              sx={{ 
                fontWeight: 400,
                fontSize: '2rem',
                color: '#FFFFFF',
                letterSpacing: '0.02em',
                position: 'absolute',
                top: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1,
                width: '100%',
              }}
            >
              BEYOND BORDERS
            </Typography>
            <Typography 
              variant="body1" 
              component="p"
              sx={{
                color: '#FFFFFF',
                fontSize: '0.875rem',
                fontWeight: 400,
                lineHeight: 1,
                position: 'absolute',
                top: 56,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1,
                width: 279,
                textAlign: 'center',
              }}
            >
              Add a flag border to your profile picture
            </Typography>

            {/* Step Indicators - positioned absolutely to fit in SVG cutouts */}
            <Box
              sx={{
                position: 'absolute',
                top: 95.5 - 19.5, // y position minus radius to center
                left: 0,
                width: '100%',
                height: 39,
              }}
            >
              {/* Step 1 */}
              <Box
                component="button"
                onClick={() => completedSteps.includes(1) && goToStep(1)}
                disabled={!completedSteps.includes(1)}
                type="button"
                aria-label={completedSteps.includes(1) ? `Go back to step 1: ${STEP_TITLES[0]}` : undefined}
                sx={{
                  position: 'absolute',
                  left: 63.5 - 19.5, // x position minus radius
                  width: 39,
                  height: 39,
                  borderRadius: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: currentStep === 1 ? 'primary.main' : 'primary.light',
                  border: currentStep === 1 ? '5px solid' : 'none',
                  borderColor: currentStep === 1 ? 'primary.light' : 'transparent',
                  color: 'white',
                  cursor: completedSteps.includes(1) ? 'pointer' : 'default',
                  padding: 0,
                  transition: 'transform 0.2s',
                  '&:hover': completedSteps.includes(1) ? { transform: 'scale(1.05)' } : {},
                  '&:disabled': {
                    cursor: 'default',
                  },
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 400, fontSize: '0.9375rem' }}>
                  1
                </Typography>
              </Box>

              {/* Step 2 */}
              <Box
                component="button"
                onClick={() => completedSteps.includes(2) && goToStep(2)}
                disabled={!completedSteps.includes(2)}
                type="button"
                aria-label={completedSteps.includes(2) ? `Go back to step 2: ${STEP_TITLES[1]}` : undefined}
                sx={{
                  position: 'absolute',
                  left: 152.5 - 19.5,
                  width: 39,
                  height: 39,
                  borderRadius: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: currentStep === 2 ? 'primary.main' : 'primary.light',
                  border: currentStep === 2 ? '5px solid' : 'none',
                  borderColor: currentStep === 2 ? 'primary.light' : 'transparent',
                  color: 'white',
                  cursor: completedSteps.includes(2) ? 'pointer' : 'default',
                  padding: 0,
                  transition: 'transform 0.2s',
                  '&:hover': completedSteps.includes(2) ? { transform: 'scale(1.05)' } : {},
                  '&:disabled': {
                    cursor: 'default',
                  },
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 400, fontSize: '0.9375rem' }}>
                  2
                </Typography>
              </Box>

              {/* Step 3 */}
              <Box
                component="button"
                onClick={() => completedSteps.includes(3) && goToStep(3)}
                disabled={!completedSteps.includes(3)}
                type="button"
                aria-label={completedSteps.includes(3) ? `Go back to step 3: ${STEP_TITLES[2]}` : undefined}
                sx={{
                  position: 'absolute',
                  left: 241.5 - 19.5,
                  width: 39,
                  height: 39,
                  borderRadius: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: currentStep === 3 ? 'primary.main' : 'primary.light',
                  border: currentStep === 3 ? '5px solid' : 'none',
                  borderColor: currentStep === 3 ? 'primary.light' : 'transparent',
                  color: 'white',
                  cursor: completedSteps.includes(3) ? 'pointer' : 'default',
                  padding: 0,
                  transition: 'transform 0.2s',
                  '&:hover': completedSteps.includes(3) ? { transform: 'scale(1.05)' } : {},
                  '&:disabled': {
                    cursor: 'default',
                  },
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 400, fontSize: '0.9375rem' }}>
                  3
                </Typography>
              </Box>
            </Box>

            {/* Step Labels below the circles */}
            <Box
              sx={{
                position: 'absolute',
                top: 95.5 + 19.5 + 8, // below circles with 8px gap
                left: 0,
                width: '100%',
                height: 13,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  left: 63.5 - 15, // centered under step 1
                  width: 30,
                  textAlign: 'center',
                  fontSize: '0.625rem',
                  color: currentStep === 1 ? 'primary.main' : 'primary.light',
                }}
              >
                {STEP_TITLES[0]}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  left: 152.5 - 10.5, // centered under step 2
                  width: 21,
                  textAlign: 'center',
                  fontSize: '0.625rem',
                  color: currentStep === 2 ? 'primary.main' : 'primary.light',
                }}
              >
                {STEP_TITLES[1]}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  left: 241.5 - 15.5, // centered under step 3
                  width: 31,
                  textAlign: 'center',
                  fontSize: '0.625rem',
                  color: currentStep === 3 ? 'primary.main' : 'primary.light',
                }}
              >
                {STEP_TITLES[2]}
              </Typography>
            </Box>
          </Box>

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
              
              <Box sx={{ width: '100%', maxWidth: 279, mx: 'auto' }}>
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

        {/* Footer with dark background */}
        <Box
          component="footer"
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: '#1B1F22',
            py: 1.5,
            textAlign: 'center',
            zIndex: 999,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: '#F97316',
              fontSize: '0.6875rem',
              fontWeight: 300,
              display: 'block',
              mb: 0.5,
            }}
          >
            Ethics and Sustainability | GitHub Open Source
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: '#FFFFFF',
              fontSize: '0.6875rem',
              fontWeight: 300,
            }}
          >
            © Nix Crabtree, 2005
          </Typography>
        </Box>
      </Box>
    </>
  );
}
