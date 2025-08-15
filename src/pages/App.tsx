import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { ThemeModeContext } from '../main';
import { flags } from '@/flags/flags';
import type { FlagSpec } from '@/flags/schema';
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
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import FileUploadIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';

export function App() {
  const { mode, setMode } = useContext(ThemeModeContext);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [flagId, setFlagId] = useState(flags[0]?.id ?? '');
  const [thickness, setThickness] = useState(7);
  const size = 1024 as const; // Size of the canvas (fixed at 1024)
  const [insetPct, setInsetPct] = useState(0); // +inset, -outset as percent of size
  const [bg, setBg] = useState<string | 'transparent'>('transparent');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const checkerRef = useRef<HTMLCanvasElement | null>(null);
  const theme = useTheme();

  const selectedFlag = useMemo<FlagSpec | undefined>(
    () => flags.find((f) => f.id === flagId),
    [flagId],
  );

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setImageUrl(url);
  }

  async function draw() {
    if (!imageUrl || !selectedFlag || !canvasRef.current) return;
    // rendering state intentionally omitted for simplicity
    const img = await createImageBitmap(await (await fetch(imageUrl)).blob());
    // Inset (+) should increase the gap (smaller image radius), Outset (-) reduces it.
    // Renderer interprets positive imageInsetPx as increasing gap, so negate here if current behavior is reversed.
    const imageInsetPx = Math.round(((insetPct * -1) / 100) * size);
    const blob = await renderAvatar(img, selectedFlag, {
      size,
      thicknessPct: thickness,
      imageInsetPx,
      backgroundColor: bg === 'transparent' ? null : bg,
    });
    const c = canvasRef.current;
    const ctx = c.getContext('2d')!;
    c.width = size;
    c.height = size;
    ctx.clearRect(0, 0, size, size);
  // wrapper provides checkerboard when bg === 'transparent'

    // Create blob URL and set it on the overlay <img> so transparency reveals the checkerboard.
    const blobUrl = URL.createObjectURL(blob);
    try {
      // Revoke previous blob URL if present on img
      const prev = (imgRef.current as any)?.dataset?.previewUrl;
      if (prev) URL.revokeObjectURL(prev);
    } catch {
      // ignore
    }
    if (imgRef.current) {
      imgRef.current.src = blobUrl;
      try {
        (imgRef.current as any).dataset.previewUrl = blobUrl;
      } catch {
        // ignore
      }
    }
  }

  useEffect(() => {
    // Auto-apply whenever inputs change
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl, flagId, thickness, size, insetPct, bg]);

  useEffect(() => {
    // Draw checkerboard into the checker canvas when transparent background is selected
    const c = checkerRef.current;
    if (!c) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = c.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    c.style.width = `${w}px`;
    c.style.height = `${h}px`;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (bg !== 'transparent') {
      ctx.clearRect(0, 0, w, h);
      return;
    }

    // Checker colours more contrasting for visibility
    const checker1 = theme.palette.mode === 'dark' ? '#0b1220' : '#ffffff';
    const checker2 = theme.palette.mode === 'dark' ? '#14202b' : '#e6e6e6';
    const tile = 18; // CSS tile size used elsewhere

    ctx.clearRect(0, 0, w, h);
    for (let y = 0; y < h; y += tile) {
      for (let x = 0; x < w; x += tile) {
        const isEven = ((x / tile) + (y / tile)) % 2 === 0;
        ctx.fillStyle = isEven ? checker1 : checker2;
        ctx.fillRect(x, y, tile, tile);
      }
    }
  }, [bg, theme.palette.mode]);

  return (
    <Container sx={{ py: 4 }} maxWidth="lg">
      <Box mb={2} display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h5">Beyond Borders</Typography>
          <Typography variant="body2" color="text.secondary">
            Add a circular, flag-colored border to your profile picture.
          </Typography>
        </Box>
        <IconButton
          onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
          color="inherit"
          aria-label="Toggle dark mode"
        >
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Box>

      <Grid container spacing={2}>
        <Grid xs={12} md={6}>
          <Paper sx={{ p: 2 }} elevation={1}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2">Upload image</Typography>
                <Button
                  component="label"
                  startIcon={<FileUploadIcon />}
                  sx={{ mt: 1 }}
                  variant="outlined"
                >
                  Choose file
                  <input
                    hidden
                    accept="image/png, image/jpeg"
                    type="file"
                    onChange={onFileChange}
                  />
                </Button>
              </Box>

              <FormControl fullWidth>
                <InputLabel id="flag-select-label">Flag</InputLabel>
                <Select
                  labelId="flag-select-label"
                  value={flagId}
                  label="Flag"
                  onChange={(e) => setFlagId(e.target.value as string)}
                >
                  {flags.map((f) => (
                    <MenuItem key={f.id} value={f.id}>
                      {f.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box>
                <Typography gutterBottom>Border thickness: {thickness}%</Typography>
                <Slider
                  min={5}
                  max={20}
                  value={thickness}
                  onChange={(_, v) => setThickness(v as number)}
                  aria-label="Border thickness"
                />
              </Box>

              <Grid container spacing={1}>
                <Grid xs={12}>
                  <Typography variant="body2">Inset/Outset: {insetPct}%</Typography>
                  <Slider
                    min={-5}
                    max={5}
                    value={insetPct}
                    onChange={(_, v) => setInsetPct(v as number)}
                    aria-label="Inset outset"
                  />
                </Grid>
              </Grid>

              <Box>
                <FormControl fullWidth>
                  <InputLabel id="bg-label">Background</InputLabel>
                  <Select
                    labelId="bg-label"
                    value={bg}
                    label="Background"
                    onChange={(e) => setBg(e.target.value as any)}
                  >
                    {/* Color preview swatches inside menu items */}
                    <MenuItem value="transparent">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 18,
                            height: 12,
                            border: '1px solid var(--muted-border)',
                            bgcolor: '#fff',
                            backgroundImage:
                              'linear-gradient(45deg,var(--muted-check) 25%, transparent 25%), linear-gradient(-45deg,var(--muted-check) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--muted-check) 75%), linear-gradient(-45deg, transparent 75%, var(--muted-check) 75%)',
                            backgroundSize: '18px 18px',
                            backgroundPosition: '0 0, 0 9px, 9px -9px, -9px 0',
                          }}
                        />
                        <Typography>Transparent</Typography>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="#ffffff">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 18,
                            height: 12,
                            border: '1px solid var(--muted-border)',
                            bgcolor: '#ffffff',
                          }}
                        />
                        <Typography>White</Typography>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="#000000">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 18,
                            height: 12,
                            border: '1px solid var(--muted-border)',
                            bgcolor: '#000000',
                          }}
                        />
                        <Typography>Black</Typography>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="#f5f5f5">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 18,
                            height: 12,
                            border: '1px solid var(--muted-border)',
                            bgcolor: '#f5f5f5',
                          }}
                        />
                        <Typography>Light Gray</Typography>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="#111827">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 18,
                            height: 12,
                            border: '1px solid var(--muted-border)',
                            bgcolor: '#111827',
                          }}
                        />
                        <Typography>Slate</Typography>
                      </Stack>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Stack direction="row" spacing={2} alignItems="center">
                {imageUrl && selectedFlag && (
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={async () => {
                      const img = await createImageBitmap(await (await fetch(imageUrl)).blob());
                      const blob = await renderAvatar(img, selectedFlag, {
                        size,
                        thicknessPct: thickness,
                        imageInsetPx: Math.round(((insetPct * -1) / 100) * size),
                        backgroundColor: bg === 'transparent' ? null : bg,
                      });
                      const a = document.createElement('a');
                      a.href = URL.createObjectURL(blob);
                      a.download = `beyond-borders_${selectedFlag.id}_${size}.png`;
                      a.click();
                    }}
                    aria-label="Download generated PNG"
                  >
                    Download PNG
                  </Button>
                )}
                <Typography variant="body2" color="text.secondary">
                  Tip: use a square headshot for best results.
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        <Grid xs={12} md={6}>
          <Paper
            sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            elevation={1}
          >
              <Box
                sx={(theme) => ({
                  width: '100%',
                  maxWidth: 360,
                borderRadius: 0, // keep square corners
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                // subtle theme-aware border and shadow to feel modern
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
                boxShadow: theme.shadows[3],
                // keep background transparent here; the inner square will render the checkerboard
                backgroundColor: 'transparent',
                p: 0,
                position: 'relative',
              })}
            >
              <Box
                sx={(theme) => ({
                  width: '100%',
                  aspectRatio: '1 / 1',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  display: 'block',
                  position: 'relative',
                  // Apply the selected background color (or transparent for checkerboard)
                  backgroundColor: bg === 'transparent' ? 'transparent' : bg,
                  backgroundImage:
                    bg === 'transparent'
                      ? (() => {
                          const checker1 = theme.palette.mode === 'dark' ? '#0b1220' : '#ffffff';
                          const checker2 = theme.palette.mode === 'dark' ? '#1f2937' : '#e6e6e6';
                          return `linear-gradient(45deg,${checker2} 25%, transparent 25%), linear-gradient(-45deg,${checker2} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${checker2} 75%), linear-gradient(-45deg, transparent 75%, ${checker2} 75%), linear-gradient(45deg,${checker1} 25%, transparent 25%), linear-gradient(-45deg,${checker1} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${checker1} 75%), linear-gradient(-45deg, transparent 75%, ${checker1} 75)`;
                        })()
                      : 'none',
                  backgroundSize: bg === 'transparent' ? '18px 18px' : undefined,
                  backgroundPosition: bg === 'transparent' ? '0 0, 0 9px, 9px -9px, -9px 0, 0 0, 0 9px, 9px -9px, -9px 0' : undefined,
                  border: undefined,
                })}
              >
                <Box
                  component="canvas"
                  ref={canvasRef}
                  width={size}
                  height={size}
                  sx={(theme) => ({
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    borderRadius: 0,
                    // ensure transparent pixels show the checkerboard beneath
                    // Keep the canvas transparent so PNG transparency shows the checkerboard
                    // or the selected background color underneath (set on the container).
                    backgroundColor: bg === 'transparent' ? 'transparent' : bg,
                    backgroundImage:
                      bg === 'transparent'
                        ? (() => {
                            const checker1 = theme.palette.mode === 'dark' ? '#0b1220' : '#ffffff';
                            const checker2 = theme.palette.mode === 'dark' ? '#1f2937' : '#e6e6e6';
                            return `linear-gradient(45deg,${checker2} 25%, transparent 25%), linear-gradient(-45deg,${checker2} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${checker2} 75%), linear-gradient(-45deg, transparent 75%, ${checker2} 75%), linear-gradient(45deg,${checker1} 25%, transparent 25%), linear-gradient(-45deg,${checker1} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${checker1} 75%), linear-gradient(-45deg, transparent 75%, ${checker1} 75)`;
                          })()
                        : 'none',
                    backgroundSize: bg === 'transparent' ? '18px 18px' : undefined,
                    backgroundPosition:
                      bg === 'transparent' ? '0 0, 0 9px, 9px -9px, -9px 0, 0 0, 0 9px, 9px -9px, -9px 0' : undefined,
                    objectFit: 'cover',
                    zIndex: 1,
                    transition: 'transform 220ms ease, opacity 180ms ease',
                  })}
                />
                {/* Checkerboard canvas sits under the avatar canvas so transparent pixels reveal it */}
                <Box
                  component="canvas"
                  ref={checkerRef}
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 0,
                    pointerEvents: 'none',
                  }}
                />
                  {/* Overlay img to display generated PNG so transparency reveals checkerboard */}
                  <Box
                    component="img"
                    ref={imgRef}
                    sx={(theme) => ({
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      pointerEvents: 'none',
                      zIndex: 10,
                      display: imageUrl ? 'block' : 'none',
                    })}
                  />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
