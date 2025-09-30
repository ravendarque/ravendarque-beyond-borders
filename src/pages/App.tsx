import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import { ThemeModeContext } from '../main';
import { loadFlags } from '../flags/loader';
import { renderAvatar } from '@/renderer/render';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Grid from '@mui/material/Unstable_Grid2';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Slider from '@mui/material/Slider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import FileUploadIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';

export function App() {
  const { mode, setMode } = useContext(ThemeModeContext);
  const theme = useTheme();

  // State
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [flagId, setFlagId] = useState<string>('');
  const [flagsList, setFlagsList] = useState<any[]>([]);
  const [thickness, setThickness] = useState(7);
  const [insetPct, setInsetPct] = useState(0);
  const [bg, setBg] = useState<string | 'transparent'>('transparent');
  const [presentation, setPresentation] = useState<'ring' | 'segment' | 'cutout'>('ring');
  const [imageOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  
  const size = 1024 as const;

  /**
   * Load available flags and restore persisted flag selection
   */
  useEffect(() => {
    (async () => {
      try {
        const loaded = await loadFlags();
        setFlagsList(loaded || []);
      } catch {
        setFlagsList([]);
      }
    })();

    // Load persisted flag from localStorage
    try {
      const stored = localStorage.getItem('bb_selectedFlag');
      if (stored) setFlagId(stored);
    } catch {}
  }, []);

  /**
   * Persist flag selection to localStorage
   */
  useEffect(() => {
    try {
      if (flagId) {
        localStorage.setItem('bb_selectedFlag', flagId);
      } else {
        localStorage.removeItem('bb_selectedFlag');
      }
    } catch {}
  }, [flagId]);

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
   * Render avatar with flag border using the provided image URL
   * This function handles the complete rendering pipeline:
   * 1. Load and validate inputs (image, flag)
   * 2. Transform flag data to renderer format
   * 3. Call renderAvatar to generate the bordered image
   * 4. Update the overlay with the result
   */
  const renderWithImageUrl = useCallback(async function renderWithImageUrl(specificImageUrl: string) {
    // Exit early if no image or canvas
    if (!specificImageUrl || !canvasRef.current) {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')!;
        ctx.clearRect(0, 0, size, size);
      }
      return;
    }

    // Clear overlay if no flag selected
    if (!flagId) {
      if (overlayUrl) {
        URL.revokeObjectURL(overlayUrl);
        setOverlayUrl(null);
      }
      return;
    }

    try {
      // Find selected flag
      const flag = flagsList.find((f: any) => f.id === flagId);
      if (!flag) return;

      // Load image
      const response = await fetch(specificImageUrl);
      const blob = await response.blob();
      const img = await createImageBitmap(blob);

      // Transform flag data to format expected by renderAvatar
      const transformedFlag = { ...flag };
      if (flag.layouts?.[0]?.colors && !flag.pattern) {
        transformedFlag.pattern = {
          stripes: flag.layouts[0].colors.map((color: string) => ({ color, weight: 1 })),
          orientation: 'horizontal'
        };
      }

      // Render avatar with flag border
      const resultBlob = await renderAvatar(img, transformedFlag, {
        size,
        thicknessPct: thickness,
        imageInsetPx: Math.round(((insetPct * -1) / 100) * size),
        imageOffsetPx: { x: Math.round(imageOffset.x), y: Math.round(imageOffset.y) },
        presentation,
        backgroundColor: bg === 'transparent' ? null : bg,
      });

      // Create overlay URL from result
      const blobUrl = URL.createObjectURL(resultBlob);
      
      // Clean up previous overlay
      if (overlayUrl) {
        URL.revokeObjectURL(overlayUrl);
      }
      
      setOverlayUrl(blobUrl);

      // Set test completion hook for E2E tests
      try { 
        (window as any).__BB_UPLOAD_DONE__ = true; 
      } catch {
        // Ignore errors setting test hooks
      }

    } catch (err) {
      // Silent fail - could add user-facing error handling here
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Failed to render avatar:', err);
      }
    }
  }, [flagId, size, thickness, insetPct, imageOffset, presentation, bg, overlayUrl, flagsList]);

  /**
   * Auto-render when image or flag selection changes
   */
  useEffect(() => {
    if (imageUrl && flagId) {
      const timeoutId = setTimeout(() => renderWithImageUrl(imageUrl), 100);
      return () => clearTimeout(timeoutId);
    }
  }, [imageUrl, flagId, renderWithImageUrl]);

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

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        {/* Header */}
        <Grid xs={12}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              Beyond Borders
            </Typography>
            <IconButton onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
              {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
            </IconButton>
          </Stack>
          <Typography variant="subtitle1" color="textSecondary">
            Add a circular, flag-colored border to your profile picture.
          </Typography>
        </Grid>

        {/* Controls */}
        <Grid xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Stack spacing={3}>
              {/* File Upload */}
              <Box>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="file-upload"
                  type="file"
                  onChange={onFileChange}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<FileUploadIcon />}
                    fullWidth
                  >
                    Choose Image
                  </Button>
                </label>
              </Box>

              {/* Flag Selection */}
              <FormControl fullWidth>
                <InputLabel>Select a flag</InputLabel>
                <Select value={flagId} onChange={(e) => setFlagId(e.target.value)} label="Select a flag">
                  <MenuItem value="">None</MenuItem>
                  {flagsList.map((flag) => (
                    <MenuItem key={flag.id} value={flag.id}>
                      {flag.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Presentation Style */}
              <FormControl component="fieldset">
                <FormLabel component="legend">Presentation</FormLabel>
                <RadioGroup
                  row
                  value={presentation}
                  onChange={(e) => setPresentation(e.target.value as 'ring' | 'segment' | 'cutout')}
                >
                  <FormControlLabel value="ring" control={<Radio />} label="Ring" />
                  <FormControlLabel value="segment" control={<Radio />} label="Segment" />
                  <FormControlLabel value="cutout" control={<Radio />} label="Cutout" />
                </RadioGroup>
              </FormControl>

              {/* Border Thickness */}
              <Box>
                <Typography gutterBottom>Border thickness: {thickness}%</Typography>
                <Slider
                  value={thickness}
                  onChange={(_, value) => setThickness(value as number)}
                  min={3}
                  max={20}
                  step={1}
                />
              </Box>

              {/* Inset/Outset */}
              <Box>
                <Typography gutterBottom>Inset/Outset: {insetPct}%</Typography>
                <Slider
                  value={insetPct}
                  onChange={(_, value) => setInsetPct(value as number)}
                  min={-10}
                  max={10}
                  step={1}
                />
              </Box>

              {/* Background */}
              <FormControl fullWidth>
                <InputLabel>Background</InputLabel>
                <Select value={bg} onChange={(e) => setBg(e.target.value)} label="Background">
                  <MenuItem value="transparent">Transparent</MenuItem>
                  <MenuItem value="#ffffff">White</MenuItem>
                  <MenuItem value="#000000">Black</MenuItem>
                </Select>
              </FormControl>

              {/* Download Button */}
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                disabled={!overlayUrl}
                fullWidth
              >
                Download
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Preview */}
        <Grid xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Preview
            </Typography>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <canvas
                ref={canvasRef}
                width={size}
                height={size}
                style={{
                  width: 300,
                  height: 300,
                  border: '1px solid',
                  borderColor: theme.palette.divider,
                  borderRadius: '50%',
                  imageRendering: 'auto',
                }}
              />
              {overlayUrl && (
                <img
                  ref={imgRef}
                  src={overlayUrl}
                  alt="Result overlay"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}