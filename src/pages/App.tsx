import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { ThemeModeContext } from '../main';
import { loadFlags } from '../flags/loader';
import { useFlagImageCache } from '@/hooks/useFlagImageCache';
import { useAvatarRenderer } from '@/hooks/useAvatarRenderer';
import { usePersistedState } from '@/hooks/usePersistedState';
import { useFocusManagement } from '@/hooks/useFocusManagement';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useFlagPreloader } from '@/hooks/useFlagPreloader';
import { ControlPanel } from '@/components/ControlPanel';
import { AvatarPreview } from '@/components/AvatarPreview';
import { ErrorAlert } from '@/components/ErrorAlert';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import type { FlagSpec } from '@/flags/schema';
import type { AppError } from '@/types/errors';
import { normalizeError } from '@/types/errors';

export function App() {
  const { mode, setMode } = useContext(ThemeModeContext);

  // Constants
  const size = 1024 as const;
  const displaySize = 300;

  // State
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [flagId, setFlagId] = usePersistedState<string>('bb_selectedFlag', '');
  const [thickness, setThickness] = useState(7);
  const [insetPct, setInsetPct] = useState(0);
  const [bg, setBg] = useState<string | 'transparent'>('transparent');
  const [presentation, setPresentation] = useState<'ring' | 'segment' | 'cutout'>('ring');
  const [flagOffsetX, setFlagOffsetX] = useState(0);
  // Trigger re-render when flags are loaded (flagsListRef doesn't cause re-renders)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [flagsLoaded, setFlagsLoaded] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>(''); // For screen reader announcements

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Use ref for flagsList since it's loaded once and never changes
  // This avoids unnecessary re-renders
  const flagsListRef = useRef<FlagSpec[]>([]);

  // Custom hooks
  const flagImageCache = useFlagImageCache();
  const { overlayUrl, isRendering, render } = useAvatarRenderer(flagsListRef.current, flagImageCache);
  const { focusRef: errorFocusRef, setFocus: focusError } = useFocusManagement<HTMLDivElement>();
  
  // Preload priority flags on idle to improve perceived performance
  useFlagPreloader(flagsListRef.current, flagImageCache, flagId);

  /**
   * Load available flags on mount
   */
  useEffect(() => {
    (async () => {
      try {
        const loaded = await loadFlags();
        flagsListRef.current = (loaded as FlagSpec[]) || [];
        setFlagsLoaded(true); // Trigger re-render to show flags
        setError(null); // Clear any previous errors
      } catch (err) {
        flagsListRef.current = [];
        setFlagsLoaded(true);
        setError(normalizeError(err));
      }
    })();
  }, []);

  /**
   * Handle file upload and trigger rendering
   */
  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImageUrl(url);

    // Render immediately with the new URL to avoid React state timing issues
    renderWithImageUrl(url);
  }

  /**
   * Render avatar with current settings
   * Note: This function is recreated on every render when any dependency changes.
   * It's wrapped with throttle below to limit actual render calls.
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
      setError(null); // Clear any previous render errors
      setStatusMessage('Avatar rendered successfully. Ready to download.');
    } catch (err) {
      const normalizedError = normalizeError(err);
      setError(normalizedError);
      setStatusMessage(`Error: ${normalizedError.message}`);
    }
  }, [render, flagId, size, thickness, insetPct, flagOffsetX, presentation, bg]);

  /**
   * Auto-render when image, flag, or render settings change
   * Uses debouncing (from sliders) + direct render call
   * The slider debouncing (150ms) already provides performance optimization
   */
  useEffect(() => {
    if (imageUrl && flagId) {
      // Call render directly - slider debouncing already limits frequency
      // No need for additional throttling since state updates are already debounced
      void renderWithImageUrl(imageUrl);
    }
  }, [imageUrl, flagId, renderWithImageUrl]);

  /**
   * Cleanup: revoke imageUrl on unmount to prevent memory leaks
   */
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  /**
   * Focus management: Focus on error when it appears
   */
  useEffect(() => {
    if (error) {
      // Small delay to ensure DOM is updated
      setTimeout(() => focusError(), 100);
    }
  }, [error, focusError]);

  /**
   * Download the rendered avatar as a PNG file
   */
  function handleDownload() {
    if (!overlayUrl) return;
    const a = document.createElement('a');
    a.href = overlayUrl;
    a.download = 'avatar-with-border.png';
    a.click();
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
      enabled: !!overlayUrl, // Only enable when avatar is ready
    },
  ]);

  return (
    <>
      {/* Screen Reader Status Announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="visually-hidden"
      >
        {statusMessage}
      </div>
      
      {/* Skip Links for Keyboard Navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#controls" className="skip-link">
        Skip to controls
      </a>
      <a href="#preview" className="skip-link">
        Skip to preview
      </a>
      
      <Container maxWidth="lg" role="main" id="main-content" aria-label="Avatar border creator application">
        <Grid container spacing={3}>
          {/* Header */}
          <Grid xs={12} component="header" role="banner">
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                Beyond Borders
              </Typography>
              <IconButton 
                onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
                aria-label={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
              </IconButton>
            </Stack>
            <Typography variant="subtitle1" color="textSecondary" component="p">
              Add a circular, flag-colored border to your profile picture.
            </Typography>
          </Grid>

        {/* Error Display */}
        {error && (
          <Grid xs={12} ref={errorFocusRef} tabIndex={-1} sx={{ outline: 'none' }}>
            <ErrorAlert
              error={error}
              onRetry={() => {
                setError(null);
                // Retry flag loading if error occurred during load
                if (flagsListRef.current.length === 0) {
                  loadFlags().then(loaded => {
                    flagsListRef.current = (loaded as FlagSpec[]) || [];
                    setFlagsLoaded(true);
                    setError(null);
                  }).catch(err => {
                    setError(normalizeError(err));
                  });
                }
                // Retry rendering if error occurred during render
                else if (imageUrl && flagId) {
                  renderWithImageUrl(imageUrl);
                }
              }}
              onDismiss={() => setError(null)}
            />
          </Grid>
        )}

        {/* Controls */}
        <Grid xs={12} md={6} component="section" aria-labelledby="controls-heading" id="controls">
          <Typography variant="h2" id="controls-heading" sx={{ fontSize: '1.25rem', fontWeight: 600, mb: 2 }}>
            Avatar Settings
          </Typography>
          <ControlPanel
            onFileChange={onFileChange}
            onFileError={setError}
            flagId={flagId}
            flags={flagsListRef.current}
            onFlagChange={setFlagId}
            presentation={presentation}
            onPresentationChange={setPresentation}
            thickness={thickness}
            onThicknessChange={setThickness}
            insetPct={insetPct}
            onInsetPctChange={setInsetPct}
            flagOffsetX={flagOffsetX}
            onFlagOffsetXChange={setFlagOffsetX}
            bg={bg}
            onBgChange={setBg}
            onDownload={handleDownload}
            downloadDisabled={!overlayUrl}
          />
        </Grid>

        {/* Preview */}
        <Grid xs={12} md={6} component="section" aria-labelledby="preview-heading" id="preview">
          <Typography variant="h2" id="preview-heading" sx={{ fontSize: '1.25rem', fontWeight: 600, mb: 2 }}>
            Preview
          </Typography>
          <AvatarPreview
            size={size}
            displaySize={displaySize}
            canvasRef={canvasRef}
            overlayUrl={overlayUrl}
            isRendering={isRendering}
          />
        </Grid>
      </Grid>
    </Container>
    </>
  );
}