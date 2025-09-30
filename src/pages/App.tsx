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
  
  // Debug state
  const [lastDebugEntries, setLastDebugEntries] = useState<any[]>([]);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  
  const size = 1024 as const;

  // Debug helper
  function pushDebugLog(obj: any) {
    try {
      if (typeof window === 'undefined') return;
      (window as any).__BB_DEBUG__ = (window as any).__BB_DEBUG__ || [];
      (window as any).__BB_DEBUG__.push(obj);
      // console.debug('[BB_DEBUG]', JSON.stringify(obj)); // Commented to avoid lint error
      setLastDebugEntries(prev => [...prev.slice(-4), obj]);
    } catch {}
  }

  // Load flags on mount
  useEffect(() => {
    (async () => {
      try {
        const loaded = await loadFlags();
        setFlagsList(loaded || []);
        pushDebugLog({ tag: 'flags', stage: 'loaded', count: Array.isArray(loaded) ? loaded.length : 0 });
      } catch {
        setFlagsList([]);
      }
    })();

    // Load persisted flag from localStorage
    try {
      const stored = localStorage.getItem('bb_selectedFlag');
      if (stored) {
        setFlagId(stored);
        pushDebugLog({ tag: 'flags', stage: 'selected-from-storage', id: stored });
      }
    } catch {}
  }, []); // flagId intentionally omitted to avoid infinite loop

  // Persist flag selection
  useEffect(() => {
    try {
      if (flagId) {
        localStorage.setItem('bb_selectedFlag', flagId);
      } else {
        localStorage.removeItem('bb_selectedFlag');
      }
    } catch {}
  }, [flagId]);

  // File upload handler
  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    
    pushDebugLog({ tag: 'upload', stage: 'received', name: f.name, size: f.size });
    
    const url = URL.createObjectURL(f);
    pushDebugLog({ tag: 'upload', stage: 'url-created', url: url.slice(-20) });
    
    setImageUrl(url);
    pushDebugLog({ tag: 'upload', stage: 'state-set' });
    
    // Call draw() with the URL directly to avoid state timing issues
    pushDebugLog({ tag: 'upload', stage: 'calling-draw-with-url' });
    drawWithUrl(url);
  }

  // Helper function that calls draw with a specific image URL
  const drawWithUrl = useCallback(async function drawWithUrl(specificImageUrl: string) {
    pushDebugLog({ tag: 'draw', stage: 'start-with-url', hasImage: !!specificImageUrl, hasFlagId: !!flagId });

    // Clear canvas if no image
    if (!specificImageUrl || !canvasRef.current) {
      pushDebugLog({ tag: 'draw', stage: 'skipped-no-image' });
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')!;
        ctx.clearRect(0, 0, size, size);
      }
      return;
    }

    // Clear overlay if no flag
    if (!flagId) {
      pushDebugLog({ tag: 'draw', stage: 'skipped-no-flag' });
      if (overlayUrl) {
        URL.revokeObjectURL(overlayUrl);
        setOverlayUrl(null);
      }
      return;
    }

    try {
      // Find flag
      let flag = flagsList.find((f: any) => f.id === flagId);
      if (!flag) {
        pushDebugLog({ tag: 'draw', stage: 'flag-not-found', flagId });
        return;
      }

      pushDebugLog({ tag: 'draw', stage: 'rendering', flagId: flag.id });

      // Load image using the specific URL
      const fetched = await fetch(specificImageUrl);
      const blob = await fetched.blob();
      const img = await createImageBitmap(blob);
      
      pushDebugLog({ tag: 'draw', stage: 'image-loaded', w: img.width, h: img.height });

      // Transform flag data to format expected by renderAvatar
      const transformedFlag = { ...flag };
      if (flag.layouts && flag.layouts.length > 0 && !flag.pattern) {
        const layout = flag.layouts[0];
        if (layout.colors && Array.isArray(layout.colors)) {
          transformedFlag.pattern = {
            stripes: layout.colors.map((color: string) => ({ color, weight: 1 })),
            orientation: 'horizontal'
          };
          pushDebugLog({ tag: 'draw', stage: 'flag-transformed', colors: layout.colors.length });
        }
      }

      // Render avatar
      const resultBlob = await renderAvatar(img, transformedFlag, {
        size,
        thicknessPct: thickness,
        imageInsetPx: Math.round(((insetPct * -1) / 100) * size),
        imageOffsetPx: { x: Math.round(imageOffset.x), y: Math.round(imageOffset.y) },
        presentation,
        backgroundColor: bg === 'transparent' ? null : bg,
      });

      pushDebugLog({ tag: 'draw', stage: 'render-complete', blobSize: resultBlob.size });

      // Create overlay
      const blobUrl = URL.createObjectURL(resultBlob);
      
      // Clean up previous overlay
      if (overlayUrl) {
        URL.revokeObjectURL(overlayUrl);
      }
      
      setOverlayUrl(blobUrl);
      pushDebugLog({ tag: 'draw', stage: 'overlay-set' });

      // Set test completion hook
      try { (window as any).__BB_UPLOAD_DONE__ = true; } catch {}

    } catch (err) {
      pushDebugLog({ tag: 'draw', stage: 'failed', error: String(err) });
      // console.error('[draw] failed:', err); // Commented to avoid lint error
    }
  }, [flagId, canvasRef, size, thickness, insetPct, imageOffset, presentation, bg, overlayUrl, flagsList, setOverlayUrl]);

  // Main draw/render function - simplified!
  const draw = useCallback(async () => {
    if (!imageUrl) return;
    pushDebugLog({ tag: 'draw', stage: 'delegating-to-url-version' });
    await drawWithUrl(imageUrl);
  }, [imageUrl, drawWithUrl]); // Dependencies for useCallback

  // Auto-redraw when parameters change
  useEffect(() => {
    if (imageUrl && flagId) {
      const timeoutId = setTimeout(() => draw(), 100);
      return () => clearTimeout(timeoutId);
    }
  }, [draw, imageUrl, flagId]); // Include all dependencies

  // Download handler
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

          {/* Debug Panel */}
          <Paper sx={{ p: 2, mt: 2, fontSize: '0.75rem', fontFamily: 'monospace' }}>
            <Typography variant="caption" display="block">
              BB debug
              imageUrl: {imageUrl ? imageUrl.slice(-20) : 'null'}
              overlayUrl: {overlayUrl ? 'set' : 'null'}
              flagId: {flagId}
              imageOffset: {imageOffset.x},{imageOffset.y}
            </Typography>
            {lastDebugEntries.slice(-3).map((entry, i) => (
              <Typography key={i} variant="caption" display="block">
                {JSON.stringify(entry)}
              </Typography>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}